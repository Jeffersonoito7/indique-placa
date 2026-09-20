import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getAssociacaoLogada } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const assoc = await getAssociacaoLogada();
  if (!assoc) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id: gestorId } = await params;

  // Confirma que o gestor pertence à associação
  const { data: gestor } = await supabaseAdmin
    .from("gestores")
    .select("id, nome, email, fone, ativo")
    .eq("id", gestorId)
    .eq("associacao_id", assoc.id)
    .maybeSingle();

  if (!gestor) return NextResponse.json({ error: "Gestor não encontrado" }, { status: 404 });

  const [consultoresRes, indicadoresRes, todosGestoresRes] = await Promise.all([
    supabaseAdmin
      .from("consultores")
      .select("id, nome, email, fone, status, plano, created_at")
      .eq("gestor_id", gestorId)
      .eq("associacao_id", assoc.id)
      .order("nome"),
    supabaseAdmin
      .from("indicadores")
      .select("id, nome, telefone, status, criado_em, consultor_id")
      .eq("gestor_id", gestorId)
      .eq("associacao_id", assoc.id)
      .order("nome"),
    supabaseAdmin
      .from("gestores")
      .select("id, nome")
      .eq("associacao_id", assoc.id)
      .eq("ativo", true)
      .order("nome"),
  ]);

  return NextResponse.json({
    gestor,
    consultores: consultoresRes.data ?? [],
    indicadores: indicadoresRes.data ?? [],
    todos_gestores: todosGestoresRes.data ?? [],
  });
}
