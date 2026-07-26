import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getGestorLogado } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

export async function GET() {
  const gestor = await getGestorLogado();
  if (!gestor) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("indicadores")
    .select("id, nome, telefone, chave_pix, email, criado_em")
    .eq("gestor_id", gestor.id)
    .is("consultor_id", null)
    .order("criado_em", { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ error: "Erro ao buscar indicadores" }, { status: 500 });

  return NextResponse.json(data ?? []);
}

const postSchema = z.object({
  nome: z.string().min(2).max(100),
  telefone: z.string().min(10).max(20),
  email: z.string().email().optional(),
  senha: z.string().min(6).max(128),
});

export async function POST(req: NextRequest) {
  const gestor = await getGestorLogado();
  if (!gestor) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requisicao invalida" }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados invalidos", detalhes: parsed.error.flatten() }, { status: 400 });

  const { nome, telefone, email, senha } = parsed.data;
  const senhaHash = await bcrypt.hash(senha, 10);

  const { data, error } = await supabaseAdmin
    .from("indicadores")
    .insert({
      nome,
      telefone,
      email: email ? email.toLowerCase() : null,
      senha_hash: senhaHash,
      gestor_id: gestor.id,
      consultor_id: null,
      associacao_id: (gestor as { associacao_id?: string }).associacao_id ?? null,
    })
    .select("id, nome, telefone, chave_pix, email, criado_em")
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Telefone ja cadastrado" }, { status: 409 });
    return NextResponse.json({ error: "Erro ao criar indicador" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const gestor = await getGestorLogado();
  if (!gestor) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Parametro id obrigatorio" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("indicadores")
    .delete()
    .eq("id", id)
    .eq("gestor_id", gestor.id)
    .is("consultor_id", null);

  if (error) return NextResponse.json({ error: "Erro ao remover indicador" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
