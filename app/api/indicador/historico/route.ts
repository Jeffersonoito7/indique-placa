import { NextRequest, NextResponse } from "next/server";
import { getIndicadorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const indicador = await getIndicadorLogado();
  if (!indicador) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const statusFiltro = searchParams.get("status");

  let query = supabaseAdmin
    .from("indicacoes")
    .select(
      "id, placa, nome_lead, telefone_lead, tipo_veiculo, status, criado_em, comissao_valor, comissao_paga, comissao_paga_em, consultor_id, consultores(nome)"
    )
    .eq("indicador_id", indicador.id)
    .order("criado_em", { ascending: false });

  if (statusFiltro && statusFiltro !== "todos") {
    query = query.eq("status", statusFiltro);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: "Erro ao buscar historico" }, { status: 500 });

  const leads = data ?? [];

  // Totais calculados sempre sobre todos os leads (sem filtro de status)
  const { data: todos } = await supabaseAdmin
    .from("indicacoes")
    .select("status, comissao_valor, comissao_paga")
    .eq("indicador_id", indicador.id);

  const todosLeads = todos ?? [];
  const total = todosLeads.length;
  const em_andamento = todosLeads.filter((l) => l.status === "novo" || l.status === "contato").length;
  const fechadas = todosLeads.filter((l) => l.status === "fechado").length;
  const comissao_total = todosLeads
    .filter((l) => l.status === "fechado")
    .reduce((acc, l) => acc + (l.comissao_valor ?? 0), 0);
  const comissao_paga = todosLeads
    .filter((l) => l.comissao_paga)
    .reduce((acc, l) => acc + (l.comissao_valor ?? 0), 0);

  return NextResponse.json({
    leads,
    totais: { total, em_andamento, fechadas, comissao_total, comissao_paga },
  });
}
