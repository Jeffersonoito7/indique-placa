import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";
import { criarSessao } from "@/lib/sessoes";
import { rateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { timingSafeEqual } from "crypto";
import { z } from "zod";

// Hash dummy para comparar quando associacao nao existe (evita timing oracle que revela emails validos)
const DUMMY_HASH = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

const schema = z.object({
  email: z.string().email(),
  senha: z.string().min(1).max(128),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const { allowed: rlAllowed } = await rateLimit(`associacao-login:${ip}`, 5, 15 * 60 * 1000);
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
    .maybeSingle();

  // Validacao: se tiver senha_hash usa bcrypt, senao usa env var
  // Sempre executa alguma comparacao para nao revelar por timing se o email existe
  const senhaHash = (assoc as Record<string, unknown> | null)?.senha_hash as string | null | undefined;
  let senhaCorreta = false;

  if (senhaHash) {
    senhaCorreta = await bcrypt.compare(senha, senhaHash);
  } else {
    const masterSenha = process.env.ASSOCIACAO_MASTER_SENHA;
    if (masterSenha) {
      try {
        const a = Buffer.from(senha);
        const b = Buffer.from(masterSenha);
        senhaCorreta = a.length === b.length && timingSafeEqual(a, b);
      } catch {
        senhaCorreta = false;
      }
    } else {
      // Executa bcrypt dummy para nao vazar timing quando nao ha senha_hash nem env var
      await bcrypt.compare(senha, DUMMY_HASH);
      senhaCorreta = false;
    }
  }

  if (!assoc || !senhaCorreta) {
    return NextResponse.json({ error: "Email ou senha incorretos" }, { status: 401 });
  }

  if (assoc.status === "inativo" || assoc.status === "suspenso") {
    return NextResponse.json({ error: "Conta inativa ou suspensa. Entre em contato com o suporte." }, { status: 403 });
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
