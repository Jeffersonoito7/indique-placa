import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { autenticarTrafego } from "@/lib/trafego-auth";
import { alterarStatusCampanha } from "@/lib/meta-api";
import { z } from "zod";

const schemaStatus = z.object({ status: z.enum(["ativa", "pausada"]) });

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = await autenticarTrafego("gestor");
  if (!id) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  const { id: campId } = await params;

  const { data: camp } = await supabaseAdmin
    .from("trafego_campanhas")
    .select("*, trafego_insights(impressoes, cliques, ctr, cpm, cpc, gasto, alcance, leads, custo_por_lead, data_referencia)")
    .eq("id", campId)
    .eq("usuario_id", id)
    .eq("usuario_tipo", "gestor")
    .order("data_referencia", { referencedTable: "trafego_insights", ascending: false })
    .maybeSingle();

  if (!camp) return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });

  const alertas = await supabaseAdmin
    .from("trafego_alertas")
    .select("*")
    .eq("campanha_id", campId)
    .order("criado_em", { ascending: false })
    .limit(20);

  return NextResponse.json({ campanha: camp, alertas: alertas.data ?? [] });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = await autenticarTrafego("gestor");
  if (!id) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  const { id: campId } = await params;

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Dados invalidos" }, { status: 400 }); }

  const parsed = schemaStatus.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Status invalido" }, { status: 400 });

  const { data: camp } = await supabaseAdmin
    .from("trafego_campanhas")
    .select("meta_campaign_id, meta_adset_id, meta_ad_id, trafego_contas(meta_access_token)")
    .eq("id", campId)
    .eq("usuario_id", id)
    .eq("usuario_tipo", "gestor")
    .maybeSingle();

  if (!camp) return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });

  const token = (camp.trafego_contas as { meta_access_token?: string } | null)?.meta_access_token;

  if (token && camp.meta_campaign_id) {
    await alterarStatusCampanha(
      token,
      { campaign_id: camp.meta_campaign_id, adset_id: camp.meta_adset_id, ad_id: camp.meta_ad_id },
      parsed.data.status === "ativa" ? "ACTIVE" : "PAUSED"
    );
  }

  await supabaseAdmin
    .from("trafego_campanhas")
    .update({ status: parsed.data.status, atualizado_em: new Date().toISOString() })
    .eq("id", campId);

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = await autenticarTrafego("gestor");
  if (!id) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  const { id: campId } = await params;

  const { data: camp } = await supabaseAdmin
    .from("trafego_campanhas")
    .select("meta_campaign_id, meta_adset_id, meta_ad_id, trafego_contas(meta_access_token)")
    .eq("id", campId)
    .eq("usuario_id", id)
    .eq("usuario_tipo", "gestor")
    .maybeSingle();

  if (!camp) return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });

  const token = (camp.trafego_contas as { meta_access_token?: string } | null)?.meta_access_token;
  if (token && camp.meta_campaign_id) {
    await alterarStatusCampanha(token, { campaign_id: camp.meta_campaign_id, adset_id: camp.meta_adset_id, ad_id: camp.meta_ad_id }, "PAUSED").catch(() => {});
  }

  await supabaseAdmin.from("trafego_campanhas").update({ status: "encerrada" }).eq("id", campId);

  return NextResponse.json({ ok: true });
}
