import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getGestorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

const STATUS_VALIDOS = ["novo", "contato", "fechado", "perdido"] as const;

const schemaPatch = z.object({
  status: z.enum(STATUS_VALIDOS).optional(),
  nome_lead: z.string().min(1).max(200).optional(),
  telefone_lead: z.string().min(1).max(30).optional(),
  tipo_veiculo: z.string().min(1).max(100).optional(),
  observacao: z.string().max(2000).nullable().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const gestor = await getGestorLogado();
  if (!gestor) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body invalido" }, { status: 400 });
  }

  const parse = schemaPatch.safeParse(body);
  if (!parse.success) {
    return NextResponse.json(
      { error: "Dados invalidos", detalhes: parse.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const campos = parse.data;
  if (Object.keys(campos).length === 0) {
    return NextResponse.json({ error: "Nenhum campo informado para atualizar" }, { status: 422 });
  }

  // Verifica propriedade antes de atualizar
  const { data: lead, error: errBusca } = await supabaseAdmin
    .from("indicacoes")
    .select("id, gestor_id")
    .eq("id", id)
    .eq("gestor_id", gestor.id)
    .maybeSingle();

  if (errBusca) {
    return NextResponse.json({ error: "Erro ao verificar lead" }, { status: 500 });
  }
  if (!lead) {
    return NextResponse.json({ error: "Lead nao encontrado" }, { status: 404 });
  }

  const { data: atualizado, error: errUpdate } = await supabaseAdmin
    .from("indicacoes")
    .update(campos)
    .eq("id", id)
    .eq("gestor_id", gestor.id)
    .select()
    .single();

  if (errUpdate) {
    return NextResponse.json({ error: "Erro ao atualizar lead" }, { status: 500 });
  }

  return NextResponse.json({ lead: atualizado });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const gestor = await getGestorLogado();
  if (!gestor) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const { id } = await params;

  // Verifica propriedade antes de deletar
  const { data: lead, error: errBusca } = await supabaseAdmin
    .from("indicacoes")
    .select("id, gestor_id")
    .eq("id", id)
    .eq("gestor_id", gestor.id)
    .maybeSingle();

  if (errBusca) {
    return NextResponse.json({ error: "Erro ao verificar lead" }, { status: 500 });
  }
  if (!lead) {
    return NextResponse.json({ error: "Lead nao encontrado" }, { status: 404 });
  }

  const { error: errDelete } = await supabaseAdmin
    .from("indicacoes")
    .delete()
    .eq("id", id)
    .eq("gestor_id", gestor.id);

  if (errDelete) {
    return NextResponse.json({ error: "Erro ao deletar lead" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
