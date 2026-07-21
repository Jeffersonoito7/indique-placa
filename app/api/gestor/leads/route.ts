import { NextRequest, NextResponse } from "next/server";
import { getGestorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const gestor = await getGestorLogado();
  if (!gestor) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const consultorIdFiltro = searchParams.get("consultor_id");
  const statusFiltro = searchParams.get("status");
  const busca = searchParams.get("busca");
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);
  const offset = (page - 1) * limit;

  // Buscar consultores do gestor
  const { data: consultores } = await supabaseAdmin
    .from("consultores")
    .select("id, nome")
    .eq("gestor_id", gestor.id);

  const consultoresLista = consultores ?? [];
  const ids = consultoresLista.map((c) => c.id);

  if (ids.length === 0) {
    return NextResponse.json({
      leads: [],
      total: 0,
      totais: { total: 0, em_andamento: 0, fechados: 0, taxa: 0 },
    });
  }

  // Query paginada com filtros
  let query = supabaseAdmin
    .from("indicacoes")
    .select(
      "id, placa, nome_lead, telefone_lead, tipo_veiculo, status, criado_em, consultor_id, indicador_id, consultores(nome), indicadores(nome)",
      { count: "exact" }
    )
    .in("consultor_id", ids)
    .order("criado_em", { ascending: false })
    .range(offset, offset + limit - 1);

  if (consultorIdFiltro) {
    query = query.eq("consultor_id", consultorIdFiltro);
  }
  if (statusFiltro && statusFiltro !== "todos") {
    query = query.eq("status", statusFiltro);
  }
  if (busca) {
    // Escapa caracteres especiais do PostgREST antes de interpolar na expressao .or()
    const buscaSegura = busca.replace(/[%_,.()"'\\]/g, "\\$&").slice(0, 100);
    query = query.or(`placa.ilike.%${buscaSegura}%,nome_lead.ilike.%${buscaSegura}%`);
  }

  const { data, count, error } = await query;

  if (error) return NextResponse.json({ error: "Erro ao buscar leads" }, { status: 500 });

  // Totais globais do gestor (sem filtro)
  const { data: todosLeads } = await supabaseAdmin
    .from("indicacoes")
    .select("status")
    .in("consultor_id", ids);

  const todos = todosLeads ?? [];
  const totalGlobal = todos.length;
  const em_andamento = todos.filter((l) => l.status === "novo" || l.status === "contato").length;
  const fechados = todos.filter((l) => l.status === "fechado").length;
  const taxa = totalGlobal > 0 ? Math.round((fechados / totalGlobal) * 100) : 0;

  return NextResponse.json({
    leads: data ?? [],
    total: count ?? 0,
    consultores: consultoresLista,
    totais: { total: totalGlobal, em_andamento, fechados, taxa },
  });
}
