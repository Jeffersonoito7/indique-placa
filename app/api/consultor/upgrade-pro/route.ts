import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";
import { validarSessao } from "@/lib/sessoes";
import EfiPay from "sdk-node-apis-efi";

async function autenticar() {
  const cookieStore = await cookies();
  const token = cookieStore.get("consultor_auth")?.value;
  if (!token) return null;
  const consultorId = await validarSessao(token, "consultor");
  if (!consultorId) return null;

  const { data: consultor } = await supabaseAdmin
    .from("consultores")
    .select("id, nome, associacao_id, plano, plano_ativo_ate")
    .eq("id", consultorId)
    .single();

  return consultor ?? null;
}

// GET: retorna configuracao de cobranca e status atual do plano
export async function GET(req: NextRequest) {
  const consultor = await autenticar();
  if (!consultor) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  // Modo status: ?txid=xxx para verificar se o pagamento foi confirmado
  const txid = req.nextUrl.searchParams.get("txid");
  if (txid) {
    const { data: cobranca } = await supabaseAdmin
      .from("cobrancas")
      .select("status")
      .eq("txid", txid)
      .eq("consultor_id", consultor.id)
      .single();

    const pago = cobranca?.status === "pago";
    return NextResponse.json({ pago, plano: consultor.plano, plano_ativo_ate: consultor.plano_ativo_ate });
  }

  // Retorna configuracao de cobranca da associacao
  const { data: assoc } = await supabaseAdmin
    .from("associacoes")
    .select("cobranca_ativa, valor_mensalidade_consultor_pro")
    .eq("id", consultor.associacao_id)
    .single();

  return NextResponse.json({
    plano: consultor.plano,
    plano_ativo_ate: consultor.plano_ativo_ate,
    cobranca_ativa: assoc?.cobranca_ativa ?? false,
    valor: Number(assoc?.valor_mensalidade_consultor_pro ?? 0),
  });
}

// POST: inicia processo de upgrade (gratuito ou gera PIX)
export async function POST(_req: NextRequest) {
  const consultor = await autenticar();
  if (!consultor) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  if (consultor.plano === "pro") {
    return NextResponse.json({ ok: true, ja_pro: true, plano_ativo_ate: consultor.plano_ativo_ate });
  }

  const { data: assoc } = await supabaseAdmin
    .from("associacoes")
    .select("id, nome, cobranca_ativa, valor_mensalidade_consultor_pro, efi_pix_key, efi_client_id, efi_client_secret, efi_certificate_base64")
    .eq("id", consultor.associacao_id)
    .single();

  if (!assoc) {
    return NextResponse.json({ error: "Associacao nao encontrada" }, { status: 404 });
  }

  const cobrancaAtiva = assoc.cobranca_ativa === true;
  const valor = Number(assoc.valor_mensalidade_consultor_pro ?? 0);

  // Plano gratuito: ativa direto sem cobranca
  if (!cobrancaAtiva || valor === 0) {
    const planoAte = new Date();
    planoAte.setDate(planoAte.getDate() + 30);

    await supabaseAdmin
      .from("consultores")
      .update({ plano: "pro", plano_ativo_ate: planoAte.toISOString() })
      .eq("id", consultor.id);

    return NextResponse.json({ ok: true, gratuito: true });
  }

  // Cobranca PIX via Efi
  if (!assoc.efi_client_id || !assoc.efi_client_secret || !assoc.efi_pix_key) {
    return NextResponse.json({ error: "Configuracao de pagamento incompleta. Contate o administrador." }, { status: 422 });
  }

  if (!assoc.efi_certificate_base64) {
    return NextResponse.json({
      error: "Certificado Efi nao configurado na associacao. Contate o administrador.",
    }, { status: 422 });
  }

  try {
    const efi = new EfiPay({
      sandbox: false,
      client_id: assoc.efi_client_id,
      client_secret: assoc.efi_client_secret,
      certificate: assoc.efi_certificate_base64 as string,
      cert_base64: true,
    });

    const valorStr = valor.toFixed(2);

    const cobranca = await efi.pixCreateImmediateCharge({
      calendario: { expiracao: 3600 },
      valor: { original: valorStr },
      chave: assoc.efi_pix_key as string,
      infoAdicionais: [
        { nome: "Servico", valor: "Consultor Pro - Indique Placa" },
        { nome: "Associacao", valor: (assoc.nome as string) ?? "" },
      ],
    });

    const txid: string = (cobranca as Record<string, unknown>).txid as string;
    const loc = (cobranca as Record<string, unknown>).loc as Record<string, unknown> | undefined;
    const locId = loc?.id as number | undefined;

    if (!locId) {
      return NextResponse.json({ error: "Erro ao criar localizacao PIX" }, { status: 500 });
    }

    const qrRes = await efi.pixGenerateQRCode({ id: locId });
    const qrcode: string = (qrRes as Record<string, unknown>).qrcode as string;
    const qrcode_image: string = ((qrRes as Record<string, unknown>).imagemQrcode as string) ?? "";

    await supabaseAdmin.from("cobrancas").insert({
      consultor_id: consultor.id,
      associacao_id: assoc.id,
      txid,
      valor,
      status: "pendente",
      descricao: "Consultor Pro - Indique Placa",
    });

    return NextResponse.json({ ok: true, qrcode, qrcode_image, txid, valor });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro ao gerar cobranca PIX";
    console.error("[upgrade-pro] Erro Efi:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
