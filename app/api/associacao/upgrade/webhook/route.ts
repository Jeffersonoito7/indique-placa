import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { timingSafeEqual } from "crypto";

// Webhook da Efi para pagamentos de associacoes ao master
// Configurar no painel Efi do master: POST /api/associacao/upgrade/webhook
export async function POST(req: NextRequest) {
  const webhookToken = process.env.WEBHOOK_EFI_TOKEN;
  if (!webhookToken) {
    return NextResponse.json({ error: "Servico indisponivel" }, { status: 503 });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const tokenRecebido = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

  let tokensIguais = false;
  try {
    const a = Buffer.from(tokenRecebido);
    const b = Buffer.from(webhookToken);
    tokensIguais = a.length === b.length && timingSafeEqual(a, b);
  } catch { tokensIguais = false; }

  if (!tokensIguais) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Payload invalido" }, { status: 400 }); }

  const payload = body as Record<string, unknown>;
  const pixArr = Array.isArray(payload?.pix) ? (payload.pix as Array<Record<string, unknown>>) : [];
  if (pixArr.length === 0) return NextResponse.json({ ok: true });

  for (const pix of pixArr) {
    const txid = typeof pix.txid === "string" ? pix.txid : null;
    if (!txid) continue;

    const { data: cobranca } = await supabaseAdmin
      .from("cobrancas")
      .update({ status: "pago", pago_em: new Date().toISOString() })
      .eq("txid", txid)
      .eq("status", "pendente")
      .eq("usuario_tipo", "associacao")
      .select("usuario_id")
      .maybeSingle();

    if (!cobranca?.usuario_id) continue;

    // Renova o status da associacao para ativo por 30 dias
    const planoAte = new Date();
    planoAte.setDate(planoAte.getDate() + 30);

    await supabaseAdmin
      .from("associacoes")
      .update({ status: "ativo", plano_ativo_ate: planoAte.toISOString() })
      .eq("id", cobranca.usuario_id);
  }

  return NextResponse.json({ ok: true });
}
