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
  const { allowed: rlAllowed } = rateLimit(`gestor-login:${ip}`, 5, 15 * 60 * 1000);
  if (!rlAllowed) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde 15 minutos." }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisição inválida" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { email, senha } = parsed.data;

  const { data: gestor } = await supabaseAdmin
    .from("gestores")
    .select("id, nome, fone, email, senha_hash, ativo")
    .eq("email", email.toLowerCase())
    .single();

  if (!gestor) {
    return NextResponse.json({ error: "Email ou senha incorretos" }, { status: 401 });
  }

  if (!gestor.ativo) {
    return NextResponse.json({ error: "Conta inativa. Entre em contato com o suporte." }, { status: 403 });
  }

  const senhaCorreta = await bcrypt.compare(senha, gestor.senha_hash);
  if (!senhaCorreta) {
    return NextResponse.json({ error: "Email ou senha incorretos" }, { status: 401 });
  }

  const token = await criarSessao(gestor.id, "gestor");

  const cookieStore = await cookies();
  cookieStore.set("gestor_auth", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 8,
    path: "/",
  });

  return NextResponse.json({ ok: true, nome: gestor.nome });
}
