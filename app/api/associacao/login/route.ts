import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";
import { criarSessao } from "@/lib/sessoes";
import { rateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  senha: z.string().min(1).max(128),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const { allowed: rlAllowed } = rateLimit(`associacao-login:${ip}`, 5, 15 * 60 * 1000);
  if (!rlAllowed) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde 15 minutos." }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisicao invalida" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });

  const { email, senha } = parsed.data;

  const { data: assoc } = await supabaseAdmin
    .from("associacoes")
    .select("id, nome, email, status, senha_hash")
    .eq("email", email.toLowerCase())
    .single();

  if (!assoc) {
    return NextResponse.json({ error: "Email ou senha incorretos" }, { status: 401 });
  }

  if (assoc.status === "inativo" || assoc.status === "suspenso") {
    return NextResponse.json({ error: "Conta inativa ou suspensa. Entre em contato com o suporte." }, { status: 403 });
  }

  // Validacao: se tiver senha_hash usa bcrypt, senao usa env var
  const senhaHash = (assoc as Record<string, unknown>).senha_hash as string | null | undefined;
  let senhaCorreta = false;

  if (senhaHash) {
    senhaCorreta = await bcrypt.compare(senha, senhaHash);
  } else {
    const masterSenha = process.env.ASSOCIACAO_MASTER_SENHA;
    if (!masterSenha) {
      console.error("[associacao/login] ASSOCIACAO_MASTER_SENHA nao configurada e sem senha_hash");
      return NextResponse.json({ error: "Configuracao de autenticacao pendente" }, { status: 500 });
    }
    senhaCorreta = senha === masterSenha;
  }

  if (!senhaCorreta) {
    return NextResponse.json({ error: "Email ou senha incorretos" }, { status: 401 });
  }

  const token = await criarSessao(assoc.id, "associacao");

  const cookieStore = await cookies();
  cookieStore.set("associacao_auth", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 8,
    path: "/",
  });

  return NextResponse.json({ ok: true, nome: assoc.nome });
}
