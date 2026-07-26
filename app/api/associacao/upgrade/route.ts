import { NextRequest, NextResponse } from "next/server";
import { getAssociacaoLogada } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { criarEfiMaster, masterEfiConfigurado } from "@/lib/efi-master";

export async function GET(req: NextRequest) {
  const assoc = await getAssociacaoLogada();
  if (!assoc) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  // Polling de status de cobranca
  const txid = req.nextUrl.searchParams.get("txid");
  if (txid) {
    const { data: cobranca } = await supabaseAdmin
      .from("cobrancas")
      .select("status")
      .eq("txid", txid)
      .eq("usuario_id", assoc.id)
      .eq("usuario_tipo", "associacao")
      .maybeSingle();

    return NextResponse.json({ pago: cobranca?.status === "pago" });
  }

  const { data: mc } = await supabaseAdmin
    .from("configuracoes_master")
    .select("cobranca_associacao_ativa, valor_associacao_trial, valor_associacao_bronze, valor_associacao_prata, valor_associacao_ouro")
    .eq("id", 1)
    .maybeSingle();

  const plano = assoc.plano ?? "trial";
  const valorMap: Record<string, number> = {
    trial:  Number(mc?.valor_associacao_trial  ?? 0),
    bronze: Number(mc?.valor_associacao_bronze ?? 0),
    prata:  Number(mc?.valor_associacao_prata  ?? 0),
    ouro:   Number(mc?.valor_associacao_ouro   ?? 0),
  };

  return NextResponse.json({
    plano,
    status: assoc.status,
    cobranca_ativa: mc?.cobranca_associacao_ativa ?? false,
    valor: valorMap[plano] ?? 0,
    master_efi_configurado: masterEfiConfigurado(),
  });
}

export async function POST(_req: NextRequest) {
  const assoc = await getAssociacaoLogada();
  if (!assoc) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  // Idempotencia: nao cria novo PIX se ja existe cobranca pendente
  const { data: cobExistente } = await supabaseAdmin
    .from("cobrancas")
    .select("txid, valor")
    .eq("usuario_id", assoc.id)
    .eq("usuario_tipo", "associacao")
    .eq("status", "pendente")
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cobExistente) {
    return NextResponse.json(
      { error: "Ja existe um PIX pendente para esta conta.", txid: cobExistente.txid },
      { status: 409 }
    );
  }

  const { data: mc } = await supabaseAdmin
    .from("configuracoes_master")
    .select("cobranca_associacao_ativa, valor_associacao_trial, valor_associacao_bronze, valor_associacao_prata, valor_associacao_ouro")
    .eq("id", 1)
    .maybeSingle();

  if (!mc?.cobranca_associacao_ativa) {
    return NextResponse.json({ error: "Cobranca de associacoes nao esta ativa no momento." }, { status: 422 });
  }

  const plano = assoc.plano ?? "trial";
  const valorMap: Record<string, number> = {
    trial:  Number(mc.valor_associacao_trial  ?? 0),
    bronze: Number(mc.valor_associacao_bronze ?? 0),
    prata:  Number(mc.valor_associacao_prata  ?? 0),
    ouro:   Number(mc.valor_associacao_ouro   ?? 0),
  };
  const valor = valorMap[plano] ?? 0;

  if (valor === 0) {
    return NextResponse.json({ error: "Valor nao configurado para este plano." }, { status: 422 });
  }

  if (!masterEfiConfigurado()) {
    return NextResponse.json({ error: "Sistema de pagamento nao configurado. Contate o suporte." }, { status: 422 });
  }

  try {
    const efi = criarEfiMaster();
    const pixKey = process.env.MASTER_EFI_PIX_KEY!;

    const cobranca = await efi.pixCreateImmediateCharge({
      calendario: { expiracao: 3600 },
      valor: { original: valor.toFixed(2) },
      chave: pixKey,
      infoAdicionais: [
        { nome: "Servico", valor: `Plano ${plano} - Indique Placa` },
        { nome: "Associacao", valor: assoc.nome },
      ],
    });

    const txid = (cobranca as Record<string, unknown>).txid as string;
    const loc = (cobranca as Record<string, unknown>).loc as Record<string, unknown> | undefined;
    const locId = loc?.id as number | undefined;
    if (!locId) throw new Error("Erro ao criar localizacao PIX");

    const qrRes = await efi.pixGenerateQRCode({ id: locId });
    const qrcode = (qrRes as Record<string, unknown>).qrcode as string;
    const qrcode_image = ((qrRes as Record<string, unknown>).imagemQrcode as string) ?? "";

    await supabaseAdmin.from("cobrancas").insert({
      usuario_id: assoc.id,
      usuario_tipo: "associacao",
      associacao_id: assoc.id,
      txid,
      valor,
      status: "pendente",
      tipo_periodo: "mensal",
    });

    return NextResponse.json({ ok: true, qrcode, qrcode_image, txid, valor });
  } catch (err) {
    console.error("[associacao/upgrade] Efi master:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao gerar PIX" }, { status: 500 });
  }
}
