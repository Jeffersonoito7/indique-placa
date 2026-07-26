import { NextResponse } from "next/server";
import { getGestorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  const gestor = await getGestorLogado();
  if (!gestor) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  // Verificar se o plano permite exportação CSV
  const { data: planoConfig } = await supabaseAdmin
    .from("planos_config_gestor")
    .select("exportar_csv")
    .eq("plano", (gestor as { plano?: string }).plano ?? "free")
    .maybeSingle();

  if (!planoConfig?.exportar_csv) {
    return NextResponse.json(
      { error: "Exportação de CSV não está disponível no seu plano. Faça upgrade Pro para usar este recurso." },
      { status: 403 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("indicacoes")
    .select("placa, nome_lead, telefone_lead, status, criado_em, comissao_valor, comissao_paga, indicadores(nome)")
    .eq("gestor_id", gestor.id)
    .order("criado_em", { ascending: false })
    .limit(10000);

  if (error) return NextResponse.json({ error: "Erro ao buscar leads" }, { status: 500 });

  // Sanitiza valores para prevenir formula injection em planilhas (Excel/Sheets)
  const sanitizeCsv = (v: string) => /^[=+\-@\t\r]/.test(v) ? `\t${v}` : v;

  const linhas = (data ?? []).map((row) => {
    const ind = row.indicadores as unknown as { nome: string } | null;
    const indicador = ind?.nome ?? "";
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
      .map((v) => `"${sanitizeCsv(String(v)).replace(/"/g, '""')}"`)
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
