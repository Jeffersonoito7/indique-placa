import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { z } from "zod";
import bcrypt from "bcryptjs";

const schema = z.object({
  nome: z.string().min(2).max(100),
  telefone: z.string().min(10).max(20),
  email: z.string().email().max(200),
  cidade: z.string().min(2).max(100),
  senha: z.string().min(6).max(128),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ gestorId: string }> }
) {
  const { allowed: rlAllowed } = await rateLimit(getRateLimitKey(req, "captura-consultor"), 3, 60 * 1000);
  if (!rlAllowed) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde 1 minuto." }, { status: 429 });
  }

  const { gestorId } = await params;

  // Verifica se o gestor existe e está ativo
  const { data: gestor } = await supabaseAdmin
    .from("gestores")
    .select("id, nome, associacao_id, ativo")
    .eq("id", gestorId)
    .maybeSingle();

  if (!gestor || !gestor.ativo) {
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

  const { nome, telefone, email, cidade, senha } = parsed.data;
  const fone = telefone.replace(/\D/g, "");

  // Email unico
  const { data: emailExistente } = await supabaseAdmin
    .from("consultores")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (emailExistente) {
    return NextResponse.json({ error: "Este e-mail já está cadastrado." }, { status: 409 });
  }

  // Fone unico
  const { data: foneExistente } = await supabaseAdmin
    .from("consultores")
    .select("id")
    .eq("fone", fone)
    .maybeSingle();

  if (foneExistente) {
    return NextResponse.json({ error: "Este telefone já está cadastrado." }, { status: 409 });
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  const { data: novo, error } = await supabaseAdmin
    .from("consultores")
    .insert({
      nome: nome.trim(),
      fone,
      email: email.toLowerCase().trim(),
      cidade: cidade.trim(),
      senha: senhaHash,
      gestor_id: gestor.id,
      associacao_id: gestor.associacao_id ?? null,
      plano: "free",
      status: "ativo",
    })
    .select("id, nome")
    .single();

  if (error || !novo) {
    console.error("[captura-consultor] insert error:", JSON.stringify({ code: error?.code, message: error?.message, details: error?.details }));
    return NextResponse.json({ error: "Erro ao criar conta. Tente novamente." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, nome: novo.nome });
}

// Retorna dados públicos do gestor para exibir na página de captura
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ gestorId: string }> }
) {
  const { gestorId } = await params;

  const { data: gestor } = await supabaseAdmin
    .from("gestores")
    .select("id, nome, ativo")
    .eq("id", gestorId)
    .maybeSingle();

  if (!gestor || !gestor.ativo) {
    return NextResponse.json({ error: "Link inválido." }, { status: 404 });
  }

  return NextResponse.json({ nome: gestor.nome });
}
