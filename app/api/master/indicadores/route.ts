import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { verificarToken } from "@/lib/master-token";
import bcrypt from "bcryptjs";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("master_auth")?.value ?? "";
  if (!verificarToken(token)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { data } = await supabaseAdmin
    .from("indicadores")
    .select("id, nome, telefone, criado_em, consultores(nome)")
    .order("criado_em", { ascending: false })
    .limit(2000);

  return NextResponse.json(data ?? []);
}

const schema = z.object({
  nome: z.string().min(2).max(100),
  telefone: z.string().min(10).max(20),
  email: z.string().email().max(200),
  senha: z.string().min(6).max(128),
  consultor_id: z.string().uuid().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const token = req.cookies.get("master_auth")?.value ?? "";
  if (!verificarToken(token)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Preencha todos os campos corretamente." }, { status: 400 });
  }

  const { nome, telefone, email, senha, consultor_id } = parsed.data;
  const tel = telefone.replace(/\D/g, "");

  const { data: existenteFone } = await supabaseAdmin
    .from("indicadores").select("id").eq("telefone", tel).maybeSingle();
  if (existenteFone) return NextResponse.json({ error: "Este WhatsApp já está cadastrado." }, { status: 409 });

  const { data: existenteEmail } = await supabaseAdmin
    .from("indicadores").select("id").eq("email", email.toLowerCase()).maybeSingle();
  if (existenteEmail) return NextResponse.json({ error: "Este e-mail já está cadastrado." }, { status: 409 });

  const senha_hash = await bcrypt.hash(senha, 10);

  const { error } = await supabaseAdmin.from("indicadores").insert({
    nome,
    telefone: tel,
    email: email.toLowerCase(),
    senha: senha_hash,
    consultor_id: consultor_id ?? null,
    status: "ativo",
  });

  if (error) {
    console.error("[master/indicadores] erro ao inserir:", error.message);
    return NextResponse.json({ error: "Erro ao salvar cadastro. Tente novamente." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
