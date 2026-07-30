import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { autenticarTrafego } from "@/lib/trafego-auth";
import { criarCampanhaMeta, buscarInsights } from "@/lib/meta-api";
import { z } from "zod";

const TIPO = "master";
const UID = "master";

const schema = z.object({
  nome: z.string().min(3).max(100),
  orcamento_diario: z.number().min(5).max(10000),
  copy_titulo: z.string().min(5).max(125),
  copy_corpo: z.string().min(10).max(500),
  copy_cta: z.string().default("LEARN_MORE"),
  imagem_url: z.string().url().optional(),
  video_id: z.string().min(1).optional(),
  publico_localizacao: z.string().optional(),
  publico_idade_min: z.number().min(18).max(65).default(25),
  publico_idade_max: z.number().min(18).max(65).default(55),
});

type InsightCard = { gasto: number; leads: number; cpl: number; ctr: number; impressoes: number };

async function gerarAlertasParaCampanha(
  campanha_id: string,
  insights: InsightCard
): Promise<void> {
  const agora = new Date();
  const limite24h = new Date(agora.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const candidatos: Array<{ titulo: string; tipo: "positivo" | "negativo"; mensagem: string }> = [];

  if (insights.cpl > 30) {
    candidatos.push({
      tipo: "negativo",
      titulo: "CPL alto",
      mensagem: `Custo por lead R$${insights.cpl.toFixed(2)} esta acima de R$30`,
    });
  }
  if (insights.ctr < 0.5) {
    candidatos.push({
      tipo: "negativo",
      titulo: "CTR baixo",
      mensagem: `Taxa de cliques ${insights.ctr.toFixed(2)}% abaixo do esperado`,
    });
  }
  if (insights.leads >= 5) {
    candidatos.push({
      tipo: "positivo",
      titulo: "Campanha performando",
      mensagem: `${insights.leads} leads em 7 dias, CPL R$${insights.cpl.toFixed(2)}`,
    });
  }

  if (candidatos.length === 0) return;

  // Busca alertas das ultimas 24h para esta campanha para deduplicar
  const { data: existentes } = await supabaseAdmin
    .from("trafego_alertas")
    .select("titulo")
    .eq("campanha_id", campanha_id)
    .gte("criado_em", limite24h);

  const titulosExistentes = new Set((existentes ?? []).map((e: { titulo: string }) => e.titulo));

  const novos = candidatos.filter(c => !titulosExistentes.has(c.titulo));
  if (novos.length === 0) return;

  await supabaseAdmin.from("trafego_alertas").insert(
    novos.map(c => ({
      campanha_id,
      tipo: c.tipo,
      titulo: c.titulo,
      mensagem: c.mensagem,
      lido: false,
    }))
  );
}

export async function GET(_req: NextRequest) {
  const id = await autenticarTrafego(TIPO);
  if (!id) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const { data } = await supabaseAdmin
    .from("trafego_campanhas")
    .select("id, nome, status, orcamento_diario, copy_titulo, criado_em, meta_campaign_id")
    .eq("usuario_id", UID)
    .eq("usuario_tipo", TIPO)
    .order("criado_em", { ascending: false })
    .limit(50);

  const campanhas = data ?? [];

  const ativas = campanhas.filter(
    (c: { status: string; meta_campaign_id: string | null }) =>
      c.status === "ativa" && c.meta_campaign_id
  );

  if (ativas.length === 0) {
    return NextResponse.json({ campanhas });
  }

  // Buscar conta Meta para ter o token
  const { data: conta } = await supabaseAdmin
    .from("trafego_contas")
    .select("meta_access_token")
    .eq("usuario_id", UID)
    .eq("usuario_tipo", TIPO)
    .eq("ativo", true)
    .maybeSingle();

  if (!conta) {
    return NextResponse.json({ campanhas });
  }

  // Buscar insights de todas as ativas em paralelo (7 dias)
  type CampanhaRow = { id: string; status: string; meta_campaign_id: string | null };
  const insightsMap: Record<string, InsightCard> = {};

  await Promise.all(
    ativas.map(async (c: CampanhaRow) => {
      try {
        const raw = await buscarInsights(conta.meta_access_token, c.meta_campaign_id!, 7);
        const cpl = raw.leads > 0 ? raw.gasto / raw.leads : 0;
        const card: InsightCard = {
          gasto: raw.gasto,
          leads: raw.leads,
          cpl,
          ctr: raw.ctr,
          impressoes: raw.impressoes,
        };
        insightsMap[c.id] = card;
        // Gera alertas em background — nao bloqueia a resposta
        void gerarAlertasParaCampanha(c.id, card).catch(() => {});
      } catch {
        // Falha nos insights nao bloqueia a listagem
      }
    })
  );

  const campanhasComInsights = campanhas.map((c: CampanhaRow) => ({
    ...c,
    insights: insightsMap[c.id] ?? null,
  }));

  return NextResponse.json({ campanhas: campanhasComInsights });
}

export async function POST(req: NextRequest) {
  const id = await autenticarTrafego(TIPO);
  if (!id) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Dados invalidos" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados invalidos", detalhes: parsed.error.flatten() }, { status: 400 });

  const { data: conta } = await supabaseAdmin
    .from("trafego_contas")
    .select("id, meta_access_token, meta_ad_account_id, meta_page_id, meta_instagram_actor_id")
    .eq("usuario_id", UID)
    .eq("usuario_tipo", TIPO)
    .eq("ativo", true)
    .maybeSingle();

  if (!conta) return NextResponse.json({ error: "Conta Meta nao conectada" }, { status: 422 });

  const { data: campanhaBD } = await supabaseAdmin
    .from("trafego_campanhas")
    .insert({
      usuario_id: UID,
      usuario_tipo: TIPO,
      conta_id: conta.id,
      nome: parsed.data.nome,
      orcamento_diario: parsed.data.orcamento_diario,
      copy_titulo: parsed.data.copy_titulo,
      copy_corpo: parsed.data.copy_corpo,
      copy_cta: parsed.data.copy_cta,
      imagem_url: parsed.data.imagem_url ?? null,
      publico_localizacao: parsed.data.publico_localizacao ?? null,
      publico_idade_min: parsed.data.publico_idade_min,
      publico_idade_max: parsed.data.publico_idade_max,
      status: "rascunho",
    })
    .select("id")
    .single();

  if (!campanhaBD) return NextResponse.json({ error: "Erro ao salvar campanha" }, { status: 500 });

  try {
    const meta = await criarCampanhaMeta(
      { access_token: conta.meta_access_token, ad_account_id: conta.meta_ad_account_id, page_id: conta.meta_page_id, instagram_actor_id: conta.meta_instagram_actor_id },
      {
        nome: parsed.data.nome,
        orcamento_diario_reais: parsed.data.orcamento_diario,
        copy_titulo: parsed.data.copy_titulo,
        copy_corpo: parsed.data.copy_corpo,
        copy_cta: parsed.data.copy_cta,
        imagem_url: parsed.data.imagem_url,
        video_id: parsed.data.video_id,
        localizacao: parsed.data.publico_localizacao,
        idade_min: parsed.data.publico_idade_min,
        idade_max: parsed.data.publico_idade_max,
      }
    );

    await supabaseAdmin
      .from("trafego_campanhas")
      .update({ status: "ativa", meta_campaign_id: meta.campaign_id, meta_adset_id: meta.adset_id, meta_ad_id: meta.ad_id, atualizado_em: new Date().toISOString() })
      .eq("id", campanhaBD.id);

    return NextResponse.json({ ok: true, id: campanhaBD.id, meta });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro Meta API";
    await supabaseAdmin.from("trafego_campanhas").update({ status: "erro", meta_erro: msg }).eq("id", campanhaBD.id);
    return NextResponse.json({ error: `Campanha salva mas erro ao publicar: ${msg}`, id: campanhaBD.id }, { status: 502 });
  }
}
