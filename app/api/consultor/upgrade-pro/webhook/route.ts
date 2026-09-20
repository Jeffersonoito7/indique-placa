import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { timingSafeEqual } from "crypto";

// Webhook da Efi: notifica quando um PIX e pago
// Configurar no painel Efi: POST para /api/consultor/upgrade-pro/webhook
// O token e configurado em WEBHOOK_EFI_TOKEN no ambiente e tambem no painel Efi em "chave de autenticacao"
export async function POST(req: NextRequest) {
  // WEBHOOK_EFI_TOKEN e OBRIGATORIO. Sem ele, o endpoint rejeita tudo.
  const webhookToken = process.env.WEBHOOK_EFI_TOKEN;
  if (!webhookToken) {
    console.error("WEBHOOK_EFI_TOKEN nao configurado — webhook bloqueado");
    return NextResponse.json({ error: "Servico indisponivel" }, { status: 503 });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const tokenRecebido = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

  let tokensIguais = false;
  try {
    const a = Buffer.from(tokenRecebido);
    const b = Buffer.from(webhookToken);
    tokensIguais = a.length === b.length && timingSafeEqual(a, b);
  } catch {
    tokensIguais = false;
  }

  if (!tokensIguais) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Payload invalido" }, { status: 400 });
  }

  // A Efi envia no formato { pix: [ { txid, valor, ... } ] }
  const payload = body as Record<string, unknown>;
  const pixArr = Array.isArray(payload?.pix) ? (payload.pix as Array<Record<string, unknown>>) : [];

  if (pixArr.length === 0) {
    // Pode ser uma notificacao de teste ou formato diferente; retorna 200 para nao retentar
    return NextResponse.json({ ok: true });
  }

  for (const pix of pixArr) {
    const txid = typeof pix.txid === "string" ? pix.txid : null;
    if (!txid) continue;

    // Valor pago informado pela Efi no payload
    const valorPago = pix.valor != null ? parseFloat(String(pix.valor)) : null;

    // Busca a cobranca pendente para validar o valor esperado antes de ativar o plano
    const { data: cobrancaPendente } = await supabaseAdmin
      .from("cobrancas")
      .select("usuario_id, usuario_tipo, tipo_periodo, valor")
      .eq("txid", txid)
      .eq("status", "pendente")
      .maybeSingle();

    if (!cobrancaPendente?.usuario_id) continue;

    // Rejeita se o valor pago for inferior ao esperado (tolerancia de R$0,01 por arredondamento)
    const valorEsperado = typeof cobrancaPendente.valor === "number" ? cobrancaPendente.valor : parseFloat(String(cobrancaPendente.valor ?? "0"));
    if (valorPago !== null && valorPago < valorEsperado - 0.01) {
      console.error(`[webhook/consultor] Valor insuficiente txid=${txid} esperado=${valorEsperado} recebido=${valorPago}`);
      continue;
    }

    // Marca como pago (idempotencia garantida pelo .eq("status", "pendente") acima)
    const { data: cobranca } = await supabaseAdmin
      .from("cobrancas")
      .update({ status: "pago", pago_em: new Date().toISOString() })
      .eq("txid", txid)
      .eq("status", "pendente")
      .select("usuario_id, usuario_tipo, tipo_periodo")
      .maybeSingle();

    if (!cobranca?.usuario_id) continue;

    // Por enquanto so trata consultores; futuramente expandir para outros tipos
    if (cobranca.usuario_tipo !== "consultor") continue;

    // Plano anual = 365 dias; mensal = 30 dias
    const isAnual = cobranca.tipo_periodo === "anual";
    const planoAte = new Date();
    planoAte.setDate(planoAte.getDate() + (isAnual ? 365 : 30));

    const { error: updatePlanoErr } = await supabaseAdmin
      .from("consultores")
      .update({ plano: "pro", plano_ativo_ate: planoAte.toISOString() })
      .eq("id", cobranca.usuario_id);

    if (updatePlanoErr) {
      console.error(`[webhook/consultor] Falha ao ativar plano txid=${txid} usuario=${cobranca.usuario_id}:`, updatePlanoErr.message);
    }
  }

  return NextResponse.json({ ok: true });
}
