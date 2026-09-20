import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getAssociacaoLogada } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const assoc = await getAssociacaoLogada();
  if (!assoc) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id: consultorId } = await params;

  const { data: consultor } = await supabaseAdmin
    .from("consultores")
    .select("id, nome, email, fone, status, plano, gestor_id")
    .eq("id", consultorId)
    .eq("associacao_id", assoc.id)
    .maybeSingle();

  if (!consultor) return NextResponse.json({ error: "Consultor não encontrado" }, { status: 404 });

  const [indicadoresRes, consultoresRes] = await Promise.all([
    supabaseAdmin
      .from("indicadores")
      .select("id, nome, telefone, status, criado_em")
      .eq("consultor_id", consultorId)
      .eq("associacao_id", assoc.id)
      .order("nome"),
    supabaseAdmin
      .from("consultores")
      .select("id, nome")
      .eq("associacao_id", assoc.id)
      .eq("status", "ativo")
      .order("nome"),
  ]);

  return NextResponse.json({
    consultor,
    indicadores: indicadoresRes.data ?? [],
    todos_consultores: consultoresRes.data ?? [],
  });
}
