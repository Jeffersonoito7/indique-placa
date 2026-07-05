import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({
  nome: z.string().min(2).max(100),
  telefone: z.string().min(10).max(20),
  email: z.string().email().optional().nullable(),
  senha: z.string().min(6).max(100),
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
    return NextResponse.json({ error: "Requisicao invalida" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });
  }

  const { nome, telefone, email, senha } = parsed.data;
  const tel = telefone.replace(/\D/g, "");

  const { data: existente } = await supabaseAdmin
    .from("consultores")
    .select("id")
    .eq("telefone", tel)
    .single();

  if (existente) {
    return NextResponse.json({ error: "Telefone ja cadastrado" }, { status: 409 });
  }

  const { default: bcrypt } = await import("bcryptjs");
  const senha_hash = await bcrypt.hash(senha, 10);

  const { error } = await supabaseAdmin.from("consultores").insert({
    nome,
    telefone: tel,
    email: email ?? null,
    senha: senha_hash,
    status: "ativo",
  });

  if (error) {
    return NextResponse.json({ error: "Erro ao cadastrar" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
