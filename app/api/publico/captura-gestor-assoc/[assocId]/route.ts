import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { z } from "zod";
import bcrypt from "bcryptjs";

const schema = z.object({
  nome: z.string().min(2).max(100),
  email: z.string().email().max(200),
  fone: z.string().min(10).max(20),
  senha: z.string().min(6).max(128),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ assocId: string }> }
) {
  const { allowed } = await rateLimit(getRateLimitKey(req, "captura-gestor-assoc"), 3, 60 * 1000);
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

  const { nome, email, fone, senha } = parsed.data;
  const foneNumeros = fone.replace(/\D/g, "");
  const emailNorm = email.toLowerCase().trim();

  const { data: emailExistente, error: errEmail } = await supabaseAdmin
    .from("gestores")
    .select("id")
    .eq("email", emailNorm)
    .maybeSingle();
  if (errEmail) return NextResponse.json({ error: "Erro ao verificar cadastro." }, { status: 500 });
  if (emailExistente) return NextResponse.json({ error: "Este e-mail já está cadastrado." }, { status: 409 });

  const { data: foneExistente, error: errFone } = await supabaseAdmin
    .from("gestores")
    .select("id")
    .eq("fone", foneNumeros)
    .maybeSingle();
  if (errFone) return NextResponse.json({ error: "Erro ao verificar cadastro." }, { status: 500 });
  if (foneExistente) return NextResponse.json({ error: "Este WhatsApp já está cadastrado." }, { status: 409 });

  const senha_hash = await bcrypt.hash(senha, 10);

  const { error } = await supabaseAdmin.from("gestores").insert({
    nome: nome.trim(),
    email: emailNorm,
    fone: foneNumeros,
    senha_hash,
    associacao_id: assoc.id,
    ativo: true,
    plano: "free",
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
    .from("associacoes")
    .select("id, nome, status")
    .eq("id", assocId)
    .maybeSingle();

  if (!assoc || assoc.status !== "ativo") {
    return NextResponse.json({ error: "Link inválido." }, { status: 404 });
  }

  return NextResponse.json({ nome: assoc.nome });
}
