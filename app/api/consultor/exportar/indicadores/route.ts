import { NextResponse } from "next/server";
import { getConsultorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  const consultor = await getConsultorLogado();
  if (!consultor) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { data: indicadores, error: errInd } = await supabaseAdmin
    .from("indicadores")
    .select("id, nome, telefone")
    .eq("consultor_id", consultor.id);

  if (errInd) return NextResponse.json({ error: "Erro ao buscar indicadores" }, { status: 500 });

  if (!indicadores || indicadores.length === 0) {
    const csv = "nome,telefone,total_indicacoes,fechadas,comissao_total\n";
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="indicadores.csv"',
      },
    });
  }

  const ids = indicadores.map((i) => i.id);

  const { data: leads, error: errLeads } = await supabaseAdmin
    .from("indicacoes")
    .select("indicador_id, status, comissao_valor, comissao_paga")
    .in("indicador_id", ids)
    .eq("consultor_id", consultor.id);

  if (errLeads) return NextResponse.json({ error: "Erro ao buscar leads" }, { status: 500 });

  const mapa: Record<string, { total: number; fechadas: number; comissao_total: number }> = {};
  for (const id of ids) {
    mapa[id] = { total: 0, fechadas: 0, comissao_total: 0 };
  }

  for (const lead of leads ?? []) {
    if (!lead.indicador_id || !mapa[lead.indicador_id]) continue;
    mapa[lead.indicador_id].total++;
    if (lead.status === "fechado") {
      mapa[lead.indicador_id].fechadas++;
      if (lead.comissao_paga && lead.comissao_valor != null) {
        mapa[lead.indicador_id].comissao_total += Number(lead.comissao_valor);
      }
    }
  }

  const cabecalho = "nome,telefone,total_indicacoes,fechadas,comissao_total";
  const linhas = indicadores.map((ind) => {
    const agg = mapa[ind.id];
    return [ind.nome ?? "", ind.telefone ?? "", agg.total, agg.fechadas, agg.comissao_total]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",");
  });

  const csv = [cabecalho, ...linhas].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="indicadores.csv"',
    },
  });
}
