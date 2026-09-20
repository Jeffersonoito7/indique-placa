import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getAssociacaoLogada } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const patchSchema = z.object({
  nome: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  fone: z.string().min(10).max(20).optional(),
  nova_senha: z.string().min(6).max(128).optional(),
  status: z.enum(["ativo", "inativo"]).optional(),
  plano: z.enum(["gratis", "pro"]).optional(),
  plano_ativo_ate: z.string().nullable().optional(),
  parceiros_habilitado: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const assoc = await getAssociacaoLogada();
  if (!assoc) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;

  const { data: consultor } = await supabaseAdmin
    .from("consultores")
    .select("id")
    .eq("id", id)
    .eq("associacao_id", assoc.id)
    .maybeSingle();

  if (!consultor) return NextResponse.json({ error: "Consultor não encontrado" }, { status: 404 });

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

  const { error } = await supabaseAdmin.from("consultores").update(update).eq("id", id).eq("associacao_id", assoc.id);
  if (error) return NextResponse.json({ error: "Erro ao atualizar consultor" }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const assoc = await getAssociacaoLogada();
  if (!assoc) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;

  const { data: consultor } = await supabaseAdmin
    .from("consultores")
    .select("id")
    .eq("id", id)
    .eq("associacao_id", assoc.id)
    .maybeSingle();

  if (!consultor) return NextResponse.json({ error: "Consultor não encontrado" }, { status: 404 });

  // Desvincula indicacoes e indicadores antes de excluir (evita violacao de FK)
  await supabaseAdmin.from("indicacoes").update({ consultor_id: null }).eq("consultor_id", id);
  await supabaseAdmin.from("indicadores").update({ consultor_id: null }).eq("consultor_id", id);

  const { error } = await supabaseAdmin.from("consultores").delete().eq("id", id).eq("associacao_id", assoc.id);
  if (error) return NextResponse.json({ error: "Erro ao excluir consultor" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
