import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";
import { criarSessao } from "@/lib/sessoes";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { z } from "zod";

const DUMMY_HASH = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

const schema = z.object({
  email: z.string().email().max(200),
  senha: z.string().min(1).max(128),
});

export async function POST(req: NextRequest) {
  const { allowed, retryAfter } = await rateLimit(getRateLimitKey(req, "consultor-login"), 5, 15 * 60 * 1000);
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

  const { email, senha } = parsed.data;

  const { data: consultor } = await supabaseAdmin
    .from("consultores")
    .select("id, nome, fone, senha_hash, status")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  // Sempre executa bcrypt para nao revelar por timing se o email existe
  const hashParaComparar = consultor?.senha_hash ?? DUMMY_HASH;
  const senhaCorreta = await bcrypt.compare(senha, hashParaComparar);

  if (!consultor || !senhaCorreta) {
    return NextResponse.json({ error: "E-mail ou senha incorretos" }, { status: 401 });
  }

  if (consultor.status !== "ativo") {
    return NextResponse.json({ error: "Conta inativa. Entre em contato com o suporte." }, { status: 403 });
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
