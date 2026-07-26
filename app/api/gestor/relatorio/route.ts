import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getGestorLogado } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const gestor = await getGestorLogado();
  if (!gestor) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  // Verificar permissoes do plano
  const { data: planoConfig } = await supabaseAdmin
    .from("planos_config_gestor")
    .select("relatorios_equipe, exportar_csv")
    .eq("plano", (gestor as { plano?: string }).plano ?? "free")
    .maybeSingle();

  if (!planoConfig?.relatorios_equipe) {
    return NextResponse.json(
      { error: "Relatorios de equipe nao estao disponiveis no seu plano. Entre em contato com o administrador para upgrade." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const de = searchParams.get("de");
  const ate = searchParams.get("ate");

  // Buscar consultores do gestor
  const { data: consultores } = await supabaseAdmin
    .from("consultores")
    .select("id, nome, email, fone, status, plano")
    .eq("gestor_id", gestor.id)
    .limit(200);

  const consultoresLista = consultores ?? [];
  const ids = consultoresLista.map((c) => c.id);

  if (ids.length === 0) {
    return NextResponse.json({
      total_consultores: 0,
      total_leads: 0,
      total_fechamentos: 0,
      taxa_conversao: 0,
      ranking: [],
      leads_por_consultor: [],
      permite_csv: planoConfig.exportar_csv ?? false,
    });
  }

  let query = supabaseAdmin
    .from("indicacoes")
    .select("consultor_id, status, criado_em")
    .in("consultor_id", ids);

  const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
  if (de && ISO_DATE.test(de)) query = query.gte("criado_em", de);
  if (ate && ISO_DATE.test(ate)) query = query.lte("criado_em", ate + "T23:59:59.999Z");
  // Limite de seguranca: sem filtro de data aplica ultimos 90 dias para evitar scan completo
  if (!de) query = query.gte("criado_em", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

  const { data: indicacoes } = await query;
  const lista = indicacoes ?? [];

  const contagemMap: Record<string, { leads: number; fechados: number }> = {};
  for (const ind of lista) {
    if (!contagemMap[ind.consultor_id]) contagemMap[ind.consultor_id] = { leads: 0, fechados: 0 };
    contagemMap[ind.consultor_id].leads++;
    if (ind.status === "fechado") contagemMap[ind.consultor_id].fechados++;
  }

  const total_leads = lista.length;
  const total_fechamentos = lista.filter((i) => i.status === "fechado").length;
  const taxa_conversao = total_leads > 0 ? Math.round((total_fechamentos / total_leads) * 100) : 0;

  const ranking = consultoresLista
    .map((c) => {
      const contagem = contagemMap[c.id] ?? { leads: 0, fechados: 0 };
      return {
        id: c.id,
        nome: c.nome,
        email: c.email,
        fone: c.fone,
        status: c.status,
        plano: c.plano,
        leads: contagem.leads,
        fechados: contagem.fechados,
        taxa: contagem.leads > 0 ? Math.round((contagem.fechados / contagem.leads) * 100) : 0,
      };
    })
    .sort((a, b) => b.fechados - a.fechados || b.leads - a.leads);

  return NextResponse.json({
    total_consultores: consultoresLista.length,
    total_leads,
    total_fechamentos,
    taxa_conversao,
    ranking,
    leads_por_consultor: ranking,
    permite_csv: planoConfig.exportar_csv ?? false,
  });
}
