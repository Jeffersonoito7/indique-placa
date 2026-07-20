import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getGestorLogado } from "@/lib/auth";
import { z } from "zod";

async function verificarPosse(gestorId: string, consultorId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("consultores")
    .select("id")
    .eq("id", consultorId)
    .eq("gestor_id", gestorId)
    .single();
  return !!data;
}

const patchSchema = z.object({
  status: z.enum(["ativo", "inativo"]).optional(),
  plano: z.enum(["free", "pro"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gestor = await getGestorLogado();
  if (!gestor) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  const { id } = await params;

  const pertence = await verificarPosse(gestor.id, id);
  if (!pertence) return NextResponse.json({ error: "Consultor nao encontrado" }, { status: 404 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisição inválida" }, { status: 400 }); }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("consultores")
    .update(parsed.data)
    .eq("id", id)
    .select("id, nome, status, plano")
    .single();

  if (error) return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });

  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gestor = await getGestorLogado();
  if (!gestor) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  const { id } = await params;

  const pertence = await verificarPosse(gestor.id, id);
  if (!pertence) return NextResponse.json({ error: "Consultor nao encontrado" }, { status: 404 });

  const { error } = await supabaseAdmin
    .from("consultores")
    .update({ gestor_id: null })
    .eq("id", id);

  if (error) return NextResponse.json({ error: "Erro ao remover" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
