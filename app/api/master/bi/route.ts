import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { verificarToken } from "@/lib/master-token";

function auth(req: NextRequest) {
  return verificarToken(req.cookies.get("master_auth")?.value ?? "");
}

function periodoParaData(periodo: string): string {
  const dias = periodo === "7d" ? 7 : periodo === "90d" ? 90 : 30;
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString();
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const periodoParam = searchParams.get("periodo") ?? "30d";
  const periodo = ["7d", "30d", "90d"].includes(periodoParam) ? periodoParam : "30d";
  const desde = periodoParaData(periodo);

  // Queries paralelas de totais gerais
  const [
    { count: totalAssociacoes },
    { count: totalGestores },
    { count: totalConsultores },
    { count: totalIndicadores },
    { data: indicacoesDoPeriodo },
  ] = await Promise.all([
    supabaseAdmin.from("associacoes").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("gestores").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("consultores").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("indicadores").select("*", { count: "exact", head: true }),
    supabaseAdmin
      .from("indicacoes")
      .select("id, consultor_id, associacao_id, status, comissao_valor, criado_em")
      .gte("criado_em", desde)
      .limit(1000),
  ]);

  if ((indicacoesDoPeriodo?.length ?? 0) >= 1000) {
    console.warn("[master/bi] Limite de 1000 indicacoes atingido no periodo", periodo);
  }

  const inds = indicacoesDoPeriodo ?? [];
  const totalLeads = inds.length;
  const totalFechamentos = inds.filter((i) => i.status === "fechado").length;
  const comissoesTotal = inds
    .filter((i) => i.status === "fechado")
    .reduce((acc, i) => acc + (Number(i.comissao_valor) || 0), 0);

  // Por associacao
  const { data: associacoes } = await supabaseAdmin
    .from("associacoes")
    .select("id, nome, plano");

  const porAssociacao = await Promise.all(
    (associacoes ?? []).map(async (assoc) => {
      const [
        { count: totalG },
        { count: totalC },
        { count: totalI },
      ] = await Promise.all([
        supabaseAdmin.from("gestores").select("*", { count: "exact", head: true }).eq("associacao_id", assoc.id),
        supabaseAdmin.from("consultores").select("*", { count: "exact", head: true }).eq("associacao_id", assoc.id),
        supabaseAdmin.from("indicadores").select("*", { count: "exact", head: true }).eq("associacao_id", assoc.id),
      ]);

      const leadsAssoc = inds.filter((i) => i.associacao_id === assoc.id).length;
      const fechAssoc = inds.filter((i) => i.associacao_id === assoc.id && i.status === "fechado").length;

      return {
        id: assoc.id,
        nome: assoc.nome,
        plano: assoc.plano ?? "trial",
        total_gestores: totalG ?? 0,
        total_consultores: totalC ?? 0,
        total_indicadores: totalI ?? 0,
        total_leads: leadsAssoc,
        total_fechamentos: fechAssoc,
        taxa_conversao: leadsAssoc > 0 ? Math.round((fechAssoc / leadsAssoc) * 100) : 0,
      };
    })
  );

  porAssociacao.sort((a, b) => b.total_fechamentos - a.total_fechamentos);

  // Ranking consultores (do periodo, top 20)
  const { data: consultoresList } = await supabaseAdmin
    .from("consultores")
    .select("id, nome, fone, cidade, gestor_id, associacao_id, gestores(nome), associacoes(nome)");

  const consultorMap: Record<string, {
    id: string; nome: string; fone: string; associacao: string | null;
    gestor: string | null; cidade: string | null;
    total_leads: number; total_fechamentos: number; total_comissoes: number;
  }> = {};

  for (const c of (consultoresList ?? [])) {
    const assocNome = (c.associacoes as { nome?: string } | null)?.nome ?? null;
    const gestorNome = (c.gestores as { nome?: string } | null)?.nome ?? null;
    consultorMap[c.id] = {
      id: c.id,
      nome: c.nome,
      fone: c.fone,
      associacao: assocNome,
      gestor: gestorNome,
      cidade: c.cidade ?? null,
      total_leads: 0,
      total_fechamentos: 0,
      total_comissoes: 0,
    };
  }

  for (const ind of inds) {
    if (!ind.consultor_id) continue;
    if (!consultorMap[ind.consultor_id]) continue;
    const entry = consultorMap[ind.consultor_id];
    entry.total_leads++;
    if (ind.status === "fechado") {
      entry.total_fechamentos++;
      entry.total_comissoes += Number(ind.comissao_valor) || 0;
    }
  }

  const rankingConsultores = Object.values(consultorMap)
    .filter((c) => c.total_leads > 0)
    .sort((a, b) => b.total_fechamentos - a.total_fechamentos)
    .slice(0, 20)
    .map((c) => ({
      ...c,
      taxa_conversao: c.total_leads > 0 ? Math.round((c.total_fechamentos / c.total_leads) * 100) : 0,
    }));

  // Ranking gestores (top 10)
  const gestorEquipeMap: Record<string, {
    id: string; nome: string; associacao: string | null;
    total_consultores: number; total_leads_equipe: number; total_fechamentos_equipe: number;
  }> = {};

  const { data: gestoresList } = await supabaseAdmin
    .from("gestores")
    .select("id, nome, associacao_id, associacoes(nome)");

  for (const g of (gestoresList ?? [])) {
    const assocNome = (g.associacoes as { nome?: string } | null)?.nome ?? null;
    gestorEquipeMap[g.id] = {
      id: g.id,
      nome: g.nome,
      associacao: assocNome,
      total_consultores: 0,
      total_leads_equipe: 0,
      total_fechamentos_equipe: 0,
    };
  }

  for (const c of (consultoresList ?? [])) {
    if (!c.gestor_id) continue;
    if (!gestorEquipeMap[c.gestor_id]) continue;
    gestorEquipeMap[c.gestor_id].total_consultores++;
    const entry = consultorMap[c.id];
    if (entry) {
      gestorEquipeMap[c.gestor_id].total_leads_equipe += entry.total_leads;
      gestorEquipeMap[c.gestor_id].total_fechamentos_equipe += entry.total_fechamentos;
    }
  }

  const rankingGestores = Object.values(gestorEquipeMap)
    .sort((a, b) => b.total_fechamentos_equipe - a.total_fechamentos_equipe)
    .slice(0, 10);

  // Ranking indicadores (top 10 por leads)
  const { data: indicadoresList } = await supabaseAdmin
    .from("indicadores")
    .select("id, nome, consultor_id, consultores(nome)");

  const indicadorMap: Record<string, {
    id: string; nome: string; consultor: string | null;
    total_leads: number; total_fechamentos: number; total_comissoes: number;
  }> = {};

  const { data: indicacoesComIndicador } = await supabaseAdmin
    .from("indicacoes")
    .select("indicador_id, status, comissao_valor")
    .gte("criado_em", desde)
    .not("indicador_id", "is", null)
    .limit(1000);

  for (const ind of (indicadoresList ?? [])) {
    const consultorNome = (ind.consultores as { nome?: string } | null)?.nome ?? null;
    indicadorMap[ind.id] = {
      id: ind.id,
      nome: ind.nome,
      consultor: consultorNome,
      total_leads: 0,
      total_fechamentos: 0,
      total_comissoes: 0,
    };
  }

  for (const ind of (indicacoesComIndicador ?? [])) {
    if (!ind.indicador_id || !indicadorMap[ind.indicador_id]) continue;
    indicadorMap[ind.indicador_id].total_leads++;
    if (ind.status === "fechado") {
      indicadorMap[ind.indicador_id].total_fechamentos++;
      indicadorMap[ind.indicador_id].total_comissoes += Number(ind.comissao_valor) || 0;
    }
  }

  const rankingIndicadores = Object.values(indicadorMap)
    .filter((i) => i.total_leads > 0)
    .sort((a, b) => b.total_leads - a.total_leads)
    .slice(0, 10);

  // Por cidade (top 15)
  const cidadeMap: Record<string, {
    cidade: string; total_consultores: number; total_leads: number; total_fechamentos: number;
  }> = {};

  for (const c of (consultoresList ?? [])) {
    const cidade = c.cidade ?? "Não informada";
    if (!cidadeMap[cidade]) {
      cidadeMap[cidade] = { cidade, total_consultores: 0, total_leads: 0, total_fechamentos: 0 };
    }
    cidadeMap[cidade].total_consultores++;
    const entry = consultorMap[c.id];
    if (entry) {
      cidadeMap[cidade].total_leads += entry.total_leads;
      cidadeMap[cidade].total_fechamentos += entry.total_fechamentos;
    }
  }

  const porCidade = Object.values(cidadeMap)
    .sort((a, b) => b.total_leads - a.total_leads)
    .slice(0, 15);

  // Evolucao mensal (ultimos 6 meses)
  const seisM = new Date();
  seisM.setMonth(seisM.getMonth() - 5);
  seisM.setDate(1);
  seisM.setHours(0, 0, 0, 0);

  const { data: indicacoesMensais } = await supabaseAdmin
    .from("indicacoes")
    .select("status, criado_em")
    .gte("criado_em", seisM.toISOString())
    .limit(5000);

  const mesMap: Record<string, { mes: string; leads: number; fechamentos: number }> = {};
  for (const ind of (indicacoesMensais ?? [])) {
    const mes = ind.criado_em.slice(0, 7);
    if (!mesMap[mes]) mesMap[mes] = { mes, leads: 0, fechamentos: 0 };
    mesMap[mes].leads++;
    if (ind.status === "fechado") mesMap[mes].fechamentos++;
  }

  const evolucaoMensal = Object.values(mesMap).sort((a, b) => a.mes.localeCompare(b.mes));

  return NextResponse.json({
    periodo,
    totais: {
      associacoes: totalAssociacoes ?? 0,
      gestores: totalGestores ?? 0,
      consultores: totalConsultores ?? 0,
      indicadores: totalIndicadores ?? 0,
      leads: totalLeads,
      fechamentos: totalFechamentos,
      comissoes_total: comissoesTotal,
    },
    por_associacao: porAssociacao,
    ranking_consultores: rankingConsultores,
    ranking_gestores: rankingGestores,
    ranking_indicadores: rankingIndicadores,
    por_cidade: porCidade,
    evolucao_mensal: evolucaoMensal,
  });
}
