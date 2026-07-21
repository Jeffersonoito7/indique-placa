import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getAssociacaoLogada } from "@/lib/auth";
import { z } from "zod";

async function verificarPosse(assocId: string, gestorId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("gestores")
    .select("id")
    .eq("id", gestorId)
    .eq("associacao_id", assocId)
    .single();
  return !!data;
}

const patchSchema = z.object({
  ativo: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const assoc = await getAssociacaoLogada();
  if (!assoc) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  const { id } = await params;
  const pertence = await verificarPosse(assoc.id, id);
  if (!pertence) return NextResponse.json({ error: "Gestor nao encontrado" }, { status: 404 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisicao invalida" }, { status: 400 }); }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("gestores")
    .update(parsed.data)
    .eq("id", id)
    .select("id, nome, ativo")
    .single();

  if (error) {
    console.error("[associacao/gestores/id] PATCH:", error.code, error.message);
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const assoc = await getAssociacaoLogada();
  if (!assoc) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  const { id } = await params;
  const pertence = await verificarPosse(assoc.id, id);
  if (!pertence) return NextResponse.json({ error: "Gestor nao encontrado" }, { status: 404 });

  // Desvincular consultores antes de deletar
  await supabaseAdmin
    .from("consultores")
    .update({ gestor_id: null })
    .eq("gestor_id", id);

  const { error } = await supabaseAdmin
    .from("gestores")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[associacao/gestores/id] DELETE:", error.code, error.message);
    return NextResponse.json({ error: "Erro ao deletar gestor" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
