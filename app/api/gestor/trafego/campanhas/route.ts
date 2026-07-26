import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { autenticarTrafego } from "@/lib/trafego-auth";
import { criarCampanhaMeta } from "@/lib/meta-api";
import { z } from "zod";

const schema = z.object({
  nome: z.string().min(3).max(100),
  orcamento_diario: z.number().min(5).max(10000),
  copy_titulo: z.string().min(5).max(125),
  copy_corpo: z.string().min(10).max(500),
  copy_cta: z.string().default("LEARN_MORE"),
  imagem_url: z.string().url().optional(),
  publico_localizacao: z.string().optional(),
  publico_idade_min: z.number().min(18).max(65).default(25),
  publico_idade_max: z.number().min(18).max(65).default(55),
});

export async function GET(req: NextRequest) {
  const id = await autenticarTrafego("gestor");
  if (!id) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const { data } = await supabaseAdmin
    .from("trafego_campanhas")
    .select("id, nome, status, orcamento_diario, copy_titulo, criado_em, meta_campaign_id")
    .eq("usuario_id", id)
    .eq("usuario_tipo", "gestor")
    .order("criado_em", { ascending: false })
    .limit(50);

  return NextResponse.json({ campanhas: data ?? [] });
}

export async function POST(req: NextRequest) {
  const id = await autenticarTrafego("gestor");
  if (!id) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Dados invalidos" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados invalidos", detalhes: parsed.error.flatten() }, { status: 400 });

  const { data: conta } = await supabaseAdmin
    .from("trafego_contas")
    .select("id, meta_access_token, meta_ad_account_id, meta_page_id, meta_instagram_actor_id")
    .eq("usuario_id", id)
    .eq("usuario_tipo", "gestor")
    .eq("ativo", true)
    .maybeSingle();

  if (!conta) return NextResponse.json({ error: "Conta Meta nao conectada" }, { status: 422 });

  const { data: campanhaBD } = await supabaseAdmin
    .from("trafego_campanhas")
    .insert({
      usuario_id: id,
      usuario_tipo: "gestor",
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
