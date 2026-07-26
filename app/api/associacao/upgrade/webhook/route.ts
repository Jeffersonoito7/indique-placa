import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// Webhook da Efi para pagamentos PIX do master (Indique Placa)
// A Efi valida a URL enviando GET ou POST antes de registrar
export async function GET(req: NextRequest) {
  const challenge = req.nextUrl.searchParams.get("challenge");
  if (challenge) return NextResponse.json({ challenge });
  return new NextResponse(null, { status: 200 });
}

export async function POST(req: NextRequest) {

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
