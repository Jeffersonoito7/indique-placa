import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// Webhook da Efi: notifica quando um PIX e pago
// Configurar no painel Efi: POST para /api/consultor/upgrade-pro/webhook
export async function POST(req: NextRequest) {
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

    // Atualiza status da cobranca para pago
    const { data: cobranca } = await supabaseAdmin
      .from("cobrancas")
      .update({ status: "pago", pago_em: new Date().toISOString() })
      .eq("txid", txid)
      .eq("status", "pendente")
      .select("consultor_id")
      .single();

    if (!cobranca?.consultor_id) continue;

    // Ativa plano pro por 30 dias
    const planoAte = new Date();
    planoAte.setDate(planoAte.getDate() + 30);

    await supabaseAdmin
      .from("consultores")
      .update({ plano: "pro", plano_ativo_ate: planoAte.toISOString() })
      .eq("id", cobranca.consultor_id);
  }

  return NextResponse.json({ ok: true });
}
