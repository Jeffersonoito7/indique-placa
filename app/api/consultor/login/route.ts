import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";
import { criarSessao } from "@/lib/sessoes";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  telefone: z.string().min(10).max(20),
  senha: z.string().min(1).max(128),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisição inválida" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { telefone, senha } = parsed.data;
  const tel = telefone.replace(/\D/g, "");

  const { data: consultor } = await supabaseAdmin
    .from("consultores")
    .select("id, nome, fone, senha, status")
    .eq("fone", tel)
    .single();

  if (!consultor) {
    return NextResponse.json({ error: "Telefone ou senha incorretos" }, { status: 401 });
  }

  if (consultor.status !== "ativo") {
    return NextResponse.json({ error: "Conta inativa. Entre em contato com o suporte." }, { status: 403 });
  }

  const senhaCorreta = consultor.senha?.startsWith("$2b$") || consultor.senha?.startsWith("$2a$")
    ? await bcrypt.compare(senha, consultor.senha)
    : consultor.senha === senha;

  if (!senhaCorreta) {
    return NextResponse.json({ error: "Telefone ou senha incorretos" }, { status: 401 });
  }

  // Migrar senha plaintext para bcrypt na primeira autenticacao bem-sucedida
  if (!(consultor.senha?.startsWith("$2b$") || consultor.senha?.startsWith("$2a$"))) {
    const hash = await bcrypt.hash(senha, 12);
    await supabaseAdmin.from("consultores").update({ senha: hash }).eq("id", consultor.id);
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
