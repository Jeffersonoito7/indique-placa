import { NextResponse } from "next/server";
import { getConsultorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  const consultor = await getConsultorLogado();
  if (!consultor) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("indicacoes")
    .select("placa, nome_lead, telefone_lead, status, criado_em, comissao_valor, comissao_paga, indicadores(nome)")
    .eq("consultor_id", consultor.id)
    .order("criado_em", { ascending: false });

  if (error) return NextResponse.json({ error: "Erro ao buscar leads" }, { status: 500 });

  const linhas = (data ?? []).map((row) => {
    const indicador = (row.indicadores as any)?.nome ?? "";
    const data_fmt = new Date(row.criado_em).toLocaleDateString("pt-BR");
    return [
      row.placa ?? "",
      row.nome_lead ?? "",
      row.telefone_lead ?? "",
      row.status ?? "",
      data_fmt,
      row.comissao_valor != null ? String(row.comissao_valor) : "",
      row.comissao_paga ? "sim" : "nao",
      indicador,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",");
  });

  const cabecalho = "placa,nome_lead,telefone,status,data,comissao_valor,comissao_paga,indicador";
  const csv = [cabecalho, ...linhas].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="leads.csv"',
    },
  });
}
