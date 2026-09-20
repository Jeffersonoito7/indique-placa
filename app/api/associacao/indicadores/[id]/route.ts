import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getAssociacaoLogada } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const patchSchema = z.object({
  nome: z.string().min(2).max(100).optional(),
  telefone: z.string().min(10).max(20).optional(),
  nova_senha: z.string().min(6).max(128).optional(),
  consultor_id: z.string().uuid().nullable().optional(),
  status: z.enum(["ativo", "inativo"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const assoc = await getAssociacaoLogada();
  if (!assoc) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;

  // verifica que o indicador pertence a um consultor desta associação
  const { data: indicador } = await supabaseAdmin
    .from("indicadores")
    .select("id, consultor_id")
    .eq("id", id)
    .maybeSingle();

  if (!indicador) return NextResponse.json({ error: "Indicador não encontrado" }, { status: 404 });

  if (indicador.consultor_id) {
    const { data: c } = await supabaseAdmin
      .from("consultores")
      .select("id")
      .eq("id", indicador.consultor_id)
      .eq("associacao_id", assoc.id)
      .maybeSingle();
    if (!c) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisição inválida" }, { status: 400 }); }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { nova_senha, ...rest } = parsed.data;
  const update: Record<string, unknown> = { ...rest };

  if (nova_senha) {
    update.senha = await bcrypt.hash(nova_senha, 12);
  }

  if (Object.keys(update).length === 0) return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });

  const { error } = await supabaseAdmin.from("indicadores").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: "Erro ao atualizar indicador" }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const assoc = await getAssociacaoLogada();
  if (!assoc) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;

  // Verifica que o indicador pertence à associação (via consultor)
  const { data: indicador } = await supabaseAdmin
    .from("indicadores")
    .select("id, consultor_id")
    .eq("id", id)
    .maybeSingle();

  if (!indicador) return NextResponse.json({ error: "Indicador não encontrado" }, { status: 404 });

  if (indicador.consultor_id) {
    const { data: c } = await supabaseAdmin
      .from("consultores")
      .select("id")
      .eq("id", indicador.consultor_id)
      .eq("associacao_id", assoc.id)
      .maybeSingle();
    if (!c) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  // Desvincula indicacoes antes de excluir (evita violacao de FK)
  await supabaseAdmin.from("indicacoes").update({ indicador_id: null }).eq("indicador_id", id);

  const { error } = await supabaseAdmin.from("indicadores").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Erro ao excluir indicador" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
