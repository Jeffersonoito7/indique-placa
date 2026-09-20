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
  { params }: { params: Promise<{ assocId: string }> }
) {
  const { allowed } = await rateLimit(getRateLimitKey(req, "captura-consultor-assoc"), 3, 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde 1 minuto." }, { status: 429 });
  }

  const { assocId } = await params;

  const { data: assoc } = await supabaseAdmin
    .from("associacoes")
    .select("id, nome, status")
    .eq("id", assocId)
    .maybeSingle();

  if (!assoc || assoc.status !== "ativo") {
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

  const { data: foneExistente, error: errFone } = await supabaseAdmin
    .from("consultores").select("id").eq("fone", fone).maybeSingle();
  if (errFone) return NextResponse.json({ error: "Erro ao verificar cadastro." }, { status: 500 });
  if (foneExistente) return NextResponse.json({ error: "Este WhatsApp já está cadastrado." }, { status: 409 });

  const { data: emailExistente, error: errEmail } = await supabaseAdmin
    .from("consultores").select("id").eq("email", email.toLowerCase()).maybeSingle();
  if (errEmail) return NextResponse.json({ error: "Erro ao verificar cadastro." }, { status: 500 });
  if (emailExistente) return NextResponse.json({ error: "Este e-mail já está cadastrado." }, { status: 409 });

  const senhaHash = await bcrypt.hash(senha, 10);

  const { error } = await supabaseAdmin.from("consultores").insert({
    nome: nome.trim(),
    fone,
    email: email.toLowerCase().trim(),
    cidade: cidade.trim(),
    senha: senhaHash,
    associacao_id: assoc.id,
    associacao: assoc.nome,
    plano: "free",
    status: "ativo",
  });

  if (error) return NextResponse.json({ error: "Erro ao criar conta. Tente novamente." }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ assocId: string }> }
) {
  const { assocId } = await params;

  const { data: assoc } = await supabaseAdmin
    .from("associacoes").select("id, nome, status").eq("id", assocId).maybeSingle();

  if (!assoc || assoc.status !== "ativo") {
    return NextResponse.json({ error: "Link inválido." }, { status: 404 });
  }

  return NextResponse.json({ nome: assoc.nome });
}
