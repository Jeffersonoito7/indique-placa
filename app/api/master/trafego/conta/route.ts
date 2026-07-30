import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { autenticarTrafego } from "@/lib/trafego-auth";
import { validarContaMeta, alterarStatusCampanha } from "@/lib/meta-api";
import { z } from "zod";

const TIPO = "master";
const UID = "master";

const schema = z.object({
  meta_access_token: z.string().min(10),
  meta_ad_account_id: z.string().min(4),
  meta_page_id: z.string().min(4),
  meta_instagram_actor_id: z.string().optional(),
  openai_api_key: z.string().min(10).optional(),
});

export async function GET(req: NextRequest) {
  const id = await autenticarTrafego(TIPO);
  if (!id) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const { data } = await supabaseAdmin
    .from("trafego_contas")
    .select("id, meta_ad_account_id, meta_page_id, nome_conta, ativo, criado_em")
    .eq("usuario_id", UID)
    .eq("usuario_tipo", TIPO)
    .maybeSingle();

  return NextResponse.json({ conta: data });
}

export async function POST(req: NextRequest) {
  const id = await autenticarTrafego(TIPO);
  if (!id) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Dados invalidos" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });

  const { meta_access_token, meta_ad_account_id, meta_page_id, meta_instagram_actor_id, openai_api_key } = parsed.data;

  const validacao = await validarContaMeta({
    access_token: meta_access_token,
    ad_account_id: meta_ad_account_id,
    page_id: meta_page_id,
  });

  if (!validacao.ok) {
    return NextResponse.json({ error: `Token ou conta inválidos: ${validacao.erro}` }, { status: 422 });
  }

  const { data, error } = await supabaseAdmin
    .from("trafego_contas")
    .upsert({
      usuario_id: UID,
      usuario_tipo: TIPO,
      meta_access_token,
      meta_ad_account_id,
      meta_page_id,
      meta_instagram_actor_id: meta_instagram_actor_id ?? null,
      openai_api_key: openai_api_key ?? null,
      nome_conta: validacao.nome ?? meta_ad_account_id,
      ativo: true,
      atualizado_em: new Date().toISOString(),
    }, { onConflict: "usuario_id,usuario_tipo" })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, id: data.id, nome: validacao.nome });
}

export async function DELETE(req: NextRequest) {
  const id = await autenticarTrafego(TIPO);
  if (!id) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const { data: ativas } = await supabaseAdmin
    .from("trafego_campanhas")
    .select("id, meta_campaign_id, meta_adset_id, meta_ad_id, trafego_contas(meta_access_token)")
    .eq("usuario_id", UID)
    .eq("usuario_tipo", TIPO)
    .eq("status", "ativa");

  if (ativas && ativas.length > 0) {
    for (const camp of ativas) {
      const token = (camp.trafego_contas as { meta_access_token?: string } | null)?.meta_access_token;
      if (token && camp.meta_campaign_id) {
        await alterarStatusCampanha(token, { campaign_id: camp.meta_campaign_id, adset_id: camp.meta_adset_id, ad_id: camp.meta_ad_id }, "PAUSED").catch(() => {});
      }
    }
    await supabaseAdmin
      .from("trafego_campanhas")
      .update({ status: "encerrada" })
      .eq("usuario_id", UID)
      .eq("usuario_tipo", TIPO)
      .eq("status", "ativa");
  }

  await supabaseAdmin
    .from("trafego_contas")
    .delete()
    .eq("usuario_id", UID)
    .eq("usuario_tipo", TIPO);

  return NextResponse.json({ ok: true });
}
