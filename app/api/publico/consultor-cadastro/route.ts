import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import bcrypt from "bcryptjs";

const schema = z.object({
  nome: z.string().min(2).max(100),
  telefone: z.string().min(10).max(20),
  email: z.string().email().max(200),
  cidade: z.string().min(2).max(100),
  associacao: z.string().min(2).max(100),
  senha: z.string().min(6).max(128),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!rateLimit(`consultor-cadastro:${ip}`, 3, 60)) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde 1 minuto." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Preencha todos os campos corretamente" }, { status: 400 });
  }

  const { nome, telefone, email, cidade, associacao, senha } = parsed.data;
  const tel = telefone.replace(/\D/g, "");

  const { data: existenteFone } = await supabaseAdmin
    .from("consultores")
    .select("id")
    .eq("fone", tel)
    .single();

  if (existenteFone) {
    return NextResponse.json({ error: "Este WhatsApp já está cadastrado" }, { status: 409 });
  }

  const { data: existenteEmail } = await supabaseAdmin
    .from("consultores")
    .select("id")
    .eq("email", email.toLowerCase())
    .single();

  if (existenteEmail) {
    return NextResponse.json({ error: "Este email já está cadastrado" }, { status: 409 });
  }

  const senha_hash = await bcrypt.hash(senha, 10);

  const { error } = await supabaseAdmin.from("consultores").insert({
    nome,
    fone: tel,
    email: email.toLowerCase(),
    cidade,
    associacao,
    senha: senha_hash,
    status: "ativo",
  });

  if (error) {
    console.error("Erro ao cadastrar consultor:", error);
    return NextResponse.json({ error: "Erro ao salvar cadastro. Tente novamente." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
