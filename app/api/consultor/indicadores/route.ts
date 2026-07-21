import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getConsultorLogado } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

export async function GET() {
  const consultor = await getConsultorLogado();
  if (!consultor) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("indicadores")
    .select("id, nome, telefone, chave_pix, criado_em")
    .eq("consultor_id", consultor.id)
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("[consultor/indicadores] GET:", error.code, error.message);
    return NextResponse.json({ error: "Erro ao buscar indicadores" }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

const postSchema = z.object({
  nome: z.string().min(2).max(100),
  email: z.string().email().optional(),
  telefone: z.string().min(10).max(20),
  senha: z.string().min(6).max(128),
});

export async function POST(req: NextRequest) {
  const consultor = await getConsultorLogado();
  if (!consultor) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisicao invalida" }, { status: 400 }); }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });

  const { nome, email, telefone, senha } = parsed.data;
  const senhaHash = await bcrypt.hash(senha, 10);

  const { data, error } = await supabaseAdmin
    .from("indicadores")
    .insert({
      nome,
      email: email ? email.toLowerCase() : null,
      telefone: telefone.replace(/\D/g, ""),
      senha_hash: senhaHash,
      consultor_id: consultor.id,
    })
    .select("id, nome, telefone, chave_pix, criado_em")
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Telefone ja cadastrado" }, { status: 409 });
    console.error("[consultor/indicadores] POST:", error.code, error.message);
    return NextResponse.json({ error: "Erro ao criar indicador" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
