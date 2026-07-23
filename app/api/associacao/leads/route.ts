import { NextRequest, NextResponse } from "next/server";
import { getAssociacaoLogada } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const assoc = await getAssociacaoLogada();
  if (!assoc) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const statusFiltro = searchParams.get("status");
  const busca = searchParams.get("busca");
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);
  const offset = (page - 1) * limit;

  // Buscar consultores da associacao
  const { data: consultores } = await supabaseAdmin
    .from("consultores")
    .select("id")
    .eq("associacao_id", assoc.id);

  const ids = (consultores ?? []).map((c) => c.id);

  if (ids.length === 0) {
    return NextResponse.json({
      leads: [],
      total: 0,
      totais: { total: 0, novos: 0, em_andamento: 0, fechados: 0, taxa: 0 },
    });
  }

  let query = supabaseAdmin
    .from("indicacoes")
    .select(
      "id, placa, nome_lead, telefone_lead, tipo_veiculo, status, criado_em, consultor_id, consultores(nome)",
      { count: "exact" }
    )
    .in("consultor_id", ids)
    .order("criado_em", { ascending: false })
    .range(offset, offset + limit - 1);

  if (statusFiltro && statusFiltro !== "todos") {
    query = query.eq("status", statusFiltro);
  }

  if (busca) {
    query = query.or(`placa.ilike.%${busca}%,nome_lead.ilike.%${busca}%`);
  }

  const { data: leads, count } = await query;

  // Totalizadores
  const { data: totRaw } = await supabaseAdmin
    .from("indicacoes")
    .select("status")
    .in("consultor_id", ids);

  const tot = totRaw ?? [];
  const total = tot.length;
  const novos = tot.filter((r) => r.status === "novo").length;
  const em_andamento = tot.filter((r) => r.status === "em_andamento").length;
  const fechados = tot.filter((r) => r.status === "fechado").length;
  const taxa = total > 0 ? Math.round((fechados / total) * 100) : 0;

  return NextResponse.json({
    leads: leads ?? [],
    total: count ?? 0,
    totais: { total, novos, em_andamento, fechados, taxa },
  });
}
