import { NextResponse } from "next/server";
import { getGestorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  const gestor = await getGestorLogado();
  if (!gestor) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const { data: consultores } = await supabaseAdmin
    .from("consultores")
    .select("id, nome")
    .eq("gestor_id", gestor.id);

  const ids = (consultores ?? []).map((c: { id: string }) => c.id);

  if (ids.length === 0) {
    return NextResponse.json({ leads: [], consultores: [] });
  }

  const { data: leads } = await supabaseAdmin
    .from("indicacoes")
    .select("id, placa, nome_lead, status, comissao_valor, comissao_paga, criado_em, consultor_id")
    .in("consultor_id", ids)
    .eq("status", "fechado")
    .order("criado_em", { ascending: false })
    .limit(200);

  return NextResponse.json({ leads: leads ?? [], consultores: consultores ?? [] });
}
