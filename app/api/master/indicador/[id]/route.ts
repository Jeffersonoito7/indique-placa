import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { verificarToken } from "@/lib/master-token";
import { z } from "zod";

const schemaPatch = z.object({
  consultor_id: z.string().uuid().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.cookies.get("master_auth")?.value ?? "";
  if (!verificarToken(token)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const parsed = schemaPatch.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("indicadores")
    .update({ consultor_id: parsed.data.consultor_id ?? null })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.cookies.get("master_auth")?.value ?? "";
  if (!verificarToken(token)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  // Desvincular indicacoes antes de deletar (evita violacao de FK)
  const { error: errDesvincular } = await supabaseAdmin
    .from("indicacoes")
    .update({ indicador_id: null })
    .eq("indicador_id", id);

  if (errDesvincular) {
    console.error("[master/indicador/id] Falha ao desvincular indicacoes:", errDesvincular.message);
    return NextResponse.json({ error: "Erro ao desvincular indicacoes" }, { status: 500 });
  }

  const { error } = await supabaseAdmin.from("indicadores").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
