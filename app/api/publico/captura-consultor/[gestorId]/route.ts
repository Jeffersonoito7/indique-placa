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
  senha: z.string().min(6).max(128),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ gestorId: string }> }
) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const { allowed: rlAllowed } = rateLimit(`captura-consultor:${ip}`, 3, 60 * 1000);
  if (!rlAllowed) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde 1 minuto." }, { status: 429 });
  }

  const { gestorId } = await params;

  // Verifica se o gestor existe e está ativo
  const { data: gestor } = await supabaseAdmin
    .from("gestores")
    .select("id, nome, associacao_id, ativo")
    .eq("id", gestorId)
    .single();

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
    .single();

  if (emailExistente) {
    return NextResponse.json({ error: "Este e-mail já está cadastrado." }, { status: 409 });
  }

  // Fone unico
  const { data: foneExistente } = await supabaseAdmin
    .from("consultores")
    .select("id")
    .eq("fone", fone)
    .single();

  if (foneExistente) {
    return NextResponse.json({ error: "Este telefone já está cadastrado." }, { status: 409 });
  }

  const senha_hash = await bcrypt.hash(senha, 10);

  const { data: novo, error } = await supabaseAdmin
    .from("consultores")
    .insert({
      nome: nome.trim(),
      fone,
      email: email.toLowerCase().trim(),
      cidade: cidade.trim(),
      senha_hash,
      gestor_id: gestor.id,
      associacao_id: gestor.associacao_id ?? null,
      plano: "free",
      ativo: true,
    })
    .select("id, nome")
    .single();

  if (error || !novo) {
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
    .single();

  if (!gestor || !gestor.ativo) {
    return NextResponse.json({ error: "Link inválido." }, { status: 404 });
  }

  return NextResponse.json({ nome: gestor.nome });
}
