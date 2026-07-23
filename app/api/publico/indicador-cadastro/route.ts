import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { enviarEmailBoasVindas } from "@/lib/email";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  nome: z.string().min(2).max(100),
  telefone: z.string().min(10).max(20),
  email: z.string().email().max(200),
  senha: z.string().min(6).max(128),
  consultor_id: z.string().uuid().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const { allowed: rlAllowed } = await rateLimit(`indicador-cadastro:${ip}`, 3, 60 * 1000);
  if (!rlAllowed) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde 1 minuto." }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Preencha todos os campos corretamente" }, { status: 400 });
  }

  const { nome, telefone, email, senha, consultor_id } = parsed.data;
  const tel = telefone.replace(/\D/g, "");

  const { data: existenteFone } = await supabaseAdmin
    .from("indicadores")
    .select("id")
    .eq("telefone", tel)
    .single();

  if (existenteFone) {
    return NextResponse.json({ error: "Este WhatsApp já está cadastrado" }, { status: 409 });
  }

  const { data: existenteEmail } = await supabaseAdmin
    .from("indicadores")
    .select("id")
    .eq("email", email.toLowerCase())
    .single();

  if (existenteEmail) {
    return NextResponse.json({ error: "Este e-mail já está cadastrado" }, { status: 409 });
  }

  let cid = consultor_id ?? null;
  if (cid) {
    const { data: consultor } = await supabaseAdmin
      .from("consultores")
      .select("id, status")
      .eq("id", cid)
      .single();
    if (!consultor || consultor.status !== "ativo") cid = null;
  }

  const senha_hash = await bcrypt.hash(senha, 10);

  const { error } = await supabaseAdmin.from("indicadores").insert({
    nome,
    telefone: tel,
    email: email.toLowerCase(),
    senha: senha_hash,
    consultor_id: cid,
    status: "ativo",
  });

  if (error) {
    // Log interno sem expor detalhes ao cliente
    console.error("[indicador-cadastro] erro ao inserir:", error.code, error.message);
    return NextResponse.json({ error: "Erro ao salvar cadastro. Tente novamente." }, { status: 500 });
  }

  // Email de boas-vindas nao-bloqueante
  enviarEmailBoasVindas({ email: email.toLowerCase(), nome, tipo: "indicador" }).catch(() => {});

  return NextResponse.json({ ok: true });
}
