import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { z } from "zod";
import bcrypt from "bcryptjs";

const schema = z.object({
  nome: z.string().min(2).max(100),
  telefone: z.string().min(10).max(20),
  email: z.string().email().max(200),
  senha: z.string().min(6).max(128),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ consultorId: string }> }
) {
  const { allowed } = await rateLimit(getRateLimitKey(req, "captura-indicador"), 3, 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde 1 minuto." }, { status: 429 });
  }

  const { consultorId } = await params;

  const { data: consultor } = await supabaseAdmin
    .from("consultores")
    .select("id, nome, associacao_id, status")
    .eq("id", consultorId)
    .maybeSingle();

  if (!consultor || consultor.status !== "ativo") {
    return NextResponse.json({ error: "Link inválido ou expirado." }, { status: 404 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Preencha todos os campos corretamente." }, { status: 400 });
  }

  const { nome, telefone, email, senha } = parsed.data;
  const fone = telefone.replace(/\D/g, "");

  const { data: foneExistente, error: errFone } = await supabaseAdmin
    .from("indicadores")
    .select("id")
    .eq("telefone", fone)
    .maybeSingle();
  if (errFone) return NextResponse.json({ error: "Erro ao verificar cadastro." }, { status: 500 });
  if (foneExistente) return NextResponse.json({ error: "Este WhatsApp já está cadastrado." }, { status: 409 });

  const { data: emailExistente, error: errEmail } = await supabaseAdmin
    .from("indicadores")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  if (errEmail) return NextResponse.json({ error: "Erro ao verificar cadastro." }, { status: 500 });
  if (emailExistente) return NextResponse.json({ error: "Este e-mail já está cadastrado." }, { status: 409 });

  const senha_hash = await bcrypt.hash(senha, 10);

  const { error } = await supabaseAdmin.from("indicadores").insert({
    nome: nome.trim(),
    telefone: fone,
    email: email.toLowerCase().trim(),
    senha: senha_hash,
    consultor_id: consultor.id,
    status: "ativo",
    aceite_termos_em: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: "Erro ao criar conta. Tente novamente." }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ consultorId: string }> }
) {
  const { consultorId } = await params;

  const { data: consultor } = await supabaseAdmin
    .from("consultores")
    .select("id, nome, status")
    .eq("id", consultorId)
    .maybeSingle();

  if (!consultor || consultor.status !== "ativo") {
    return NextResponse.json({ error: "Link inválido." }, { status: 404 });
  }

  return NextResponse.json({ nome: consultor.nome });
}
