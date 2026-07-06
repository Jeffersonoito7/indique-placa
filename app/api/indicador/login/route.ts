import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";
import { criarSessao } from "@/lib/sessoes";
import { rateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  telefone: z.string().min(10).max(20),
  senha: z.string().min(1).max(128),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!rateLimit(`indicador-login:${ip}`, 10, 15 * 60)) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde 15 minutos." }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisição inválida" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { telefone, senha } = parsed.data;
  const tel = telefone.replace(/\D/g, "");

  const { data: indicador } = await supabaseAdmin
    .from("indicadores")
    .select("id, nome, telefone, senha, status")
    .eq("telefone", tel)
    .single();

  if (!indicador) {
    return NextResponse.json({ error: "Telefone ou senha incorretos" }, { status: 401 });
  }

  if (indicador.status && indicador.status !== "ativo") {
    return NextResponse.json({ error: "Conta inativa. Entre em contato com o suporte." }, { status: 403 });
  }

  const senhaCorreta = indicador.senha?.startsWith("$2b$") || indicador.senha?.startsWith("$2a$")
    ? await bcrypt.compare(senha, indicador.senha)
    : indicador.senha === senha;

  if (!senhaCorreta) {
    return NextResponse.json({ error: "Telefone ou senha incorretos" }, { status: 401 });
  }

  if (!(indicador.senha?.startsWith("$2b$") || indicador.senha?.startsWith("$2a$"))) {
    const hash = await bcrypt.hash(senha, 12);
    await supabaseAdmin.from("indicadores").update({ senha: hash }).eq("id", indicador.id);
  }

  const token = await criarSessao(indicador.id, "indicador");

  const cookieStore = await cookies();
  cookieStore.set("indicador_auth", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 8,
    path: "/",
  });

  return NextResponse.json({ ok: true, nome: indicador.nome });
}
