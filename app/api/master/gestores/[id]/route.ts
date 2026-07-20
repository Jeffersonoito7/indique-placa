import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { verificarToken } from "@/lib/master-token";
import { z } from "zod";
import bcrypt from "bcryptjs";

function auth(req: NextRequest) {
  return verificarToken(req.cookies.get("master_auth")?.value ?? "");
}

const schemaEditar = z.object({
  nome: z.string().min(2).max(100).optional(),
  fone: z.string().max(20).optional().nullable(),
  ativo: z.boolean().optional(),
  plano: z.enum(["free", "pro"]).optional(),
  associacao_id: z.string().uuid().optional().nullable(),
  nova_senha: z.string().min(6).max(128).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!auth(req)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Dados inválidos" }, { status: 400 }); }

  const parsed = schemaEditar.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (parsed.data.nome !== undefined) updates.nome = parsed.data.nome.trim();
  if (parsed.data.fone !== undefined) updates.fone = parsed.data.fone;
  if (parsed.data.ativo !== undefined) updates.ativo = parsed.data.ativo;
  if (parsed.data.plano !== undefined) updates.plano = parsed.data.plano;
  if (parsed.data.associacao_id !== undefined) updates.associacao_id = parsed.data.associacao_id;
  if (parsed.data.nova_senha) updates.senha_hash = await bcrypt.hash(parsed.data.nova_senha, 10);

  const { error } = await supabaseAdmin.from("gestores").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!auth(req)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;

  // Desvincula consultores antes de deletar
  await supabaseAdmin.from("consultores").update({ gestor_id: null }).eq("gestor_id", id);

  const { error } = await supabaseAdmin.from("gestores").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Erro ao remover" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
