import "server-only";

const META_VERSION = "v19.0";
const BASE = `https://graph.facebook.com/${META_VERSION}`;

export type MetaCreds = {
  access_token: string;
  ad_account_id: string;
  page_id: string;
  instagram_actor_id?: string | null;
};

async function metaGet<T>(path: string, token: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("access_token", token);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { cache: "no-store" });
  const json = await res.json() as T;
  if (!res.ok) throw new Error((json as { error?: { message?: string } }).error?.message ?? "Meta API error");
  return json;
}

async function metaPost<T>(path: string, token: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${BASE}${path}?access_token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = await res.json() as T;
  if (!res.ok) throw new Error((json as { error?: { message?: string } }).error?.message ?? "Meta API error");
  return json;
}

async function metaDelete<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${BASE}${path}?access_token=${token}`, { method: "DELETE", cache: "no-store" });
  const json = await res.json() as T;
  if (!res.ok) throw new Error((json as { error?: { message?: string } }).error?.message ?? "Meta API error");
  return json;
}

// Valida token e retorna nome da conta
export async function validarContaMeta(creds: MetaCreds): Promise<{ ok: boolean; nome?: string; erro?: string }> {
  try {
    const me = await metaGet<{ name?: string }>(`/act_${creds.ad_account_id.replace(/^act_/, "")}`, creds.access_token, {
      fields: "name,account_status",
    });
    return { ok: true, nome: me.name };
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : "Erro" };
  }
}

// Cria campanha + adset + ad no Meta
export async function criarCampanhaMeta(creds: MetaCreds, params: {
  nome: string;
  orcamento_diario_reais: number;
  copy_titulo: string;
  copy_corpo: string;
  copy_cta: string;
  imagem_url?: string;
  localizacao?: string;
  idade_min: number;
  idade_max: number;
}): Promise<{ campaign_id: string; adset_id: string; ad_id: string }> {
  const acId = `act_${creds.ad_account_id.replace(/^act_/, "")}`;
  const orcamentoCentavos = Math.round(params.orcamento_diario_reais * 100);

  // 1. Campanha
  const camp = await metaPost<{ id: string }>(`/${acId}/campaigns`, creds.access_token, {
    name: params.nome,
    objective: "OUTCOME_LEADS",
    status: "ACTIVE",
    special_ad_categories: [],
    buying_type: "AUCTION",
  });

  // 2. Targeting geo
  let geo: Record<string, unknown> = { countries: ["BR"] };
  if (params.localizacao) {
    geo = { countries: ["BR"], geo_markets: [], regions: [] };
  }

  const targeting: Record<string, unknown> = {
    geo_locations: geo,
    age_min: params.idade_min,
    age_max: params.idade_max,
    publisher_platforms: ["instagram"],
    instagram_positions: ["stream", "story", "reels"],
    flexible_spec: [
      {
        interests: [
          { id: "6003357230583", name: "Automobile" },
          { id: "6003397425735", name: "Vehicles" },
          { id: "6004183195716", name: "Automotive insurance" },
        ],
      },
    ],
  };

  // 3. Ad Set
  const adset = await metaPost<{ id: string }>(`/${acId}/adsets`, creds.access_token, {
    name: `${params.nome} - Conjunto`,
    campaign_id: camp.id,
    daily_budget: orcamentoCentavos,
    billing_event: "IMPRESSIONS",
    optimization_goal: "LEAD_GENERATION",
    bid_strategy: "LOWEST_COST_WITHOUT_CAP",
    status: "ACTIVE",
    targeting,
    start_time: Math.floor(Date.now() / 1000),
  });

  // 4. Criativo
  let creative_spec: Record<string, unknown>;

  if (params.imagem_url) {
    creative_spec = {
      instagram_actor_id: creds.instagram_actor_id ?? creds.page_id,
      link_data: {
        message: params.copy_corpo,
        name: params.copy_titulo,
        call_to_action: { type: params.copy_cta, value: { link: "https://indiqueplaca.com.br" } },
        link: "https://indiqueplaca.com.br",
        picture: params.imagem_url,
      },
    };
  } else {
    creative_spec = {
      instagram_actor_id: creds.instagram_actor_id ?? creds.page_id,
      link_data: {
        message: params.copy_corpo,
        name: params.copy_titulo,
        call_to_action: { type: params.copy_cta, value: { link: "https://indiqueplaca.com.br" } },
        link: "https://indiqueplaca.com.br",
      },
    };
  }

  const criativo = await metaPost<{ id: string }>(`/${acId}/adcreatives`, creds.access_token, {
    name: `${params.nome} - Criativo`,
    ...creative_spec,
  });

  // 5. Ad
  const ad = await metaPost<{ id: string }>(`/${acId}/ads`, creds.access_token, {
    name: `${params.nome} - Anuncio`,
    adset_id: adset.id,
    creative: { creative_id: criativo.id },
    status: "ACTIVE",
  });

  return { campaign_id: camp.id, adset_id: adset.id, ad_id: ad.id };
}

// Pausa ou retoma campanha + adset + ad
export async function alterarStatusCampanha(
  token: string,
  ids: { campaign_id?: string | null; adset_id?: string | null; ad_id?: string | null },
  status: "ACTIVE" | "PAUSED"
): Promise<void> {
  const s = { status };
  if (ids.campaign_id) await metaPost(`/${ids.campaign_id}`, token, s).catch(() => {});
  if (ids.adset_id) await metaPost(`/${ids.adset_id}`, token, s).catch(() => {});
  if (ids.ad_id) await metaPost(`/${ids.ad_id}`, token, s).catch(() => {});
}

type InsightData = {
  impressions?: string;
  clicks?: string;
  ctr?: string;
  cpm?: string;
  cpc?: string;
  spend?: string;
  reach?: string;
  actions?: Array<{ action_type: string; value: string }>;
};

// Busca insights dos ultimos N dias para uma campanha
export async function buscarInsights(token: string, campaign_id: string, dias = 1): Promise<{
  impressoes: number; cliques: number; ctr: number; cpm: number; cpc: number; gasto: number; alcance: number; leads: number;
}> {
  try {
    const res = await metaGet<{ data?: InsightData[] }>(`/${campaign_id}/insights`, token, {
      fields: "impressions,clicks,ctr,cpm,cpc,spend,reach,actions",
      date_preset: dias === 1 ? "today" : `last_${dias}_days`,
      level: "campaign",
    });
    const d = res.data?.[0];
    if (!d) return { impressoes: 0, cliques: 0, ctr: 0, cpm: 0, cpc: 0, gasto: 0, alcance: 0, leads: 0 };

    const leads = d.actions?.find(a => a.action_type === "lead")?.value ?? "0";
    return {
      impressoes: parseInt(d.impressions ?? "0"),
      cliques: parseInt(d.clicks ?? "0"),
      ctr: parseFloat(d.ctr ?? "0"),
      cpm: parseFloat(d.cpm ?? "0"),
      cpc: parseFloat(d.cpc ?? "0"),
      gasto: parseFloat(d.spend ?? "0"),
      alcance: parseInt(d.reach ?? "0"),
      leads: parseInt(leads),
    };
  } catch {
    return { impressoes: 0, cliques: 0, ctr: 0, cpm: 0, cpc: 0, gasto: 0, alcance: 0, leads: 0 };
  }
}
