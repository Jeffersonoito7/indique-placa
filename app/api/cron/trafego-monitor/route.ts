import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { buscarInsights, alterarStatusCampanha } from "@/lib/meta-api";
import { analisarPerformance } from "@/lib/trafego-agente";

// Cron chamado pelo Vercel a cada 6h
// Analisa campanhas ativas, pausa as fracas, gera alertas
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const { data: campanhas } = await supabaseAdmin
    .from("trafego_campanhas")
    .select("id, nome, status, orcamento_diario, usuario_id, usuario_tipo, meta_campaign_id, meta_adset_id, meta_ad_id, trafego_contas(meta_access_token, openai_api_key)")
    .eq("status", "ativa")
    .not("meta_campaign_id", "is", null);

  if (!campanhas || campanhas.length === 0) {
    return NextResponse.json({ ok: true, processadas: 0 });
  }

  let processadas = 0;
  let pausadas = 0;

  for (const camp of campanhas) {
    try {
      const conta = camp.trafego_contas as { meta_access_token?: string; openai_api_key?: string } | null;
      const token = conta?.meta_access_token;
      const openaiKey = conta?.openai_api_key;
      if (!token || !camp.meta_campaign_id) continue;

      const insights = await buscarInsights(token, camp.meta_campaign_id, 1);

      // Salva snapshot de hoje (upsert por dia)
      await supabaseAdmin
        .from("trafego_insights")
        .upsert({
          campanha_id: camp.id,
          data_referencia: new Date().toISOString().slice(0, 10),
          impressoes: insights.impressoes,
          cliques: insights.cliques,
          ctr: insights.ctr,
          cpm: insights.cpm,
          cpc: insights.cpc,
          gasto: insights.gasto,
          alcance: insights.alcance,
          leads: insights.leads,
          custo_por_lead: insights.leads > 0 ? insights.gasto / insights.leads : null,
        }, { onConflict: "campanha_id,data_referencia" });

      // Só analisa se tiver dados suficientes
      if (insights.impressoes < 200) {
        processadas++;
        continue;
      }

      // Regra de auto-pausa: CTR < 0.5% com impressoes > 1000 E gasto > 50% do orcamento
      const deveAutoPausar =
        insights.ctr < 0.5 &&
        insights.impressoes > 1000 &&
        insights.gasto > camp.orcamento_diario * 0.5;

      if (deveAutoPausar) {
        await alterarStatusCampanha(
          token,
          { campaign_id: camp.meta_campaign_id, adset_id: camp.meta_adset_id, ad_id: camp.meta_ad_id },
          "PAUSED"
        );
        await supabaseAdmin
          .from("trafego_campanhas")
          .update({ status: "pausada", atualizado_em: new Date().toISOString() })
          .eq("id", camp.id);
        pausadas++;

        await supabaseAdmin.from("trafego_alertas").insert({
          campanha_id: camp.id,
          usuario_id: camp.usuario_id,
          usuario_tipo: camp.usuario_tipo,
          tipo: "negativo",
          titulo: "Campanha pausada automaticamente",
          mensagem: `CTR de ${insights.ctr.toFixed(2)}% com R$${insights.gasto.toFixed(2)} gastos — desempenho abaixo do aceitavel. Troque o criativo ou o público antes de reativar.`,
          acao_tomada: "Campanha pausada automaticamente pelo sistema",
        });

        processadas++;
        continue;
      }

      // Analise com IA (so se o usuario tem chave OpenAI configurada)
      const alerta = await analisarPerformance({
        nome_campanha: camp.nome,
        impressoes: insights.impressoes,
        cliques: insights.cliques,
        ctr: insights.ctr,
        cpm: insights.cpm,
        gasto: insights.gasto,
        leads: insights.leads,
        orcamento_diario: Number(camp.orcamento_diario),
        openai_api_key: openaiKey ?? "",
      });

      // Evita alertas duplicados do mesmo dia para a mesma campanha
      const hoje = new Date().toISOString().slice(0, 10);
      const { count } = await supabaseAdmin
        .from("trafego_alertas")
        .select("*", { count: "exact", head: true })
        .eq("campanha_id", camp.id)
        .gte("criado_em", `${hoje}T00:00:00`);

      if ((count ?? 0) === 0) {
        await supabaseAdmin.from("trafego_alertas").insert({
          campanha_id: camp.id,
          usuario_id: camp.usuario_id,
          usuario_tipo: camp.usuario_tipo,
          tipo: alerta.tipo,
          titulo: alerta.titulo,
          mensagem: alerta.mensagem,
          acao_tomada: alerta.acao_tomada ?? null,
        });
      }

      processadas++;
    } catch (err) {
      console.error(`[trafego-monitor] Erro campanha ${camp.id}:`, err);
    }
  }

  return NextResponse.json({ ok: true, processadas, pausadas });
}
