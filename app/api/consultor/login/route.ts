import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";
import { criarSessao } from "@/lib/sessoes";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  telefone: z.string().min(10).max(20),
  senha: z.string().min(1).max(128),
});

export async function POST(req: NextRequest) {
  const { allowed, retryAfter } = rateLimit(getRateLimitKey(req, "consultor-login"), 5, 15 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde 15 minutos." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisição inválida" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { telefone, senha } = parsed.data;
  const tel = telefone.replace(/\D/g, "");

  const { data: consultor } = await supabaseAdmin
    .from("consultores")
    .select("id, nome, fone, senha_hash, status")
    .eq("fone", tel)
    .single();

  if (!consultor) {
    return NextResponse.json({ error: "Telefone ou senha incorretos" }, { status: 401 });
  }

  if (consultor.status !== "ativo") {
    return NextResponse.json({ error: "Conta inativa. Entre em contato com o suporte." }, { status: 403 });
  }

  if (!consultor.senha_hash) {
    return NextResponse.json({ error: "Telefone ou senha incorretos" }, { status: 401 });
  }

  const senhaCorreta = await bcrypt.compare(senha, consultor.senha_hash);

  if (!senhaCorreta) {
    return NextResponse.json({ error: "Telefone ou senha incorretos" }, { status: 401 });
  }

  const token = await criarSessao(consultor.id, "consultor");

  const cookieStore = await cookies();
  cookieStore.set("consultor_auth", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 8,
    path: "/",
  });

  return NextResponse.json({ ok: true, nome: consultor.nome });
}
