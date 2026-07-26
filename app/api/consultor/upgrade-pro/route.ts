import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";
import { validarSessao } from "@/lib/sessoes";
import { criarEfiMaster, masterEfiConfigurado } from "@/lib/efi-master";
import EfiPay from "sdk-node-apis-efi";

async function autenticar() {
  const cookieStore = await cookies();
  const token = cookieStore.get("consultor_auth")?.value;
  if (!token) return null;
  const consultorId = await validarSessao(token, "consultor");
  if (!consultorId) return null;

  const { data: consultor } = await supabaseAdmin
    .from("consultores")
    .select("id, nome, fone, associacao_id, plano, plano_ativo_ate")
    .eq("id", consultorId)
    .single();

  return consultor ?? null;
}

async function gerarPix(
  efi: EfiPay,
  pixKey: string,
  valor: number,
  descricao: string
): Promise<{ qrcode: string; qrcode_image: string; txid: string }> {
  const cobranca = await efi.pixCreateImmediateCharge({
    calendario: { expiracao: 3600 },
    valor: { original: valor.toFixed(2) },
    chave: pixKey,
    infoAdicionais: [{ nome: "Servico", valor: descricao }],
  });

  const txid = (cobranca as Record<string, unknown>).txid as string;
  const loc = (cobranca as Record<string, unknown>).loc as Record<string, unknown> | undefined;
  const locId = loc?.id as number | undefined;
  if (!locId) throw new Error("Erro ao criar localizacao PIX");

  const qrRes = await efi.pixGenerateQRCode({ id: locId });
  return {
    txid,
    qrcode: (qrRes as Record<string, unknown>).qrcode as string,
    qrcode_image: ((qrRes as Record<string, unknown>).imagemQrcode as string) ?? "",
  };
}

// GET: retorna configuracao e status do plano
export async function GET(req: NextRequest) {
  const consultor = await autenticar();
  if (!consultor) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  // Modo status: ?txid=xxx
  const txid = req.nextUrl.searchParams.get("txid");
  if (txid) {
    const { data: cobranca } = await supabaseAdmin
      .from("cobrancas")
      .select("status")
      .eq("txid", txid)
      .eq("usuario_id", consultor.id)
      .eq("usuario_tipo", "consultor")
      .maybeSingle();

    const pago = cobranca?.status === "pago";
    return NextResponse.json({ pago, plano: consultor.plano, plano_ativo_ate: consultor.plano_ativo_ate });
  }

  // Determina de onde vem a cobranca
  const [assocRes, masterConfigRes] = await Promise.all([
    consultor.associacao_id
      ? supabaseAdmin
          .from("associacoes")
          .select("cobranca_ativa, valor_mensalidade_consultor_pro, paga_pelo_time")
          .eq("id", consultor.associacao_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabaseAdmin
      .from("configuracoes_master")
      .select("cobranca_consultor_ativa, valor_consultor_mensal, valor_consultor_anual")
      .eq("id", 1)
      .maybeSingle(),
  ]);

  const assoc = assocRes.data;
  const mc = masterConfigRes.data;

  // Associacao paga pelo time: consultor isento
  if (assoc?.paga_pelo_time) {
    return NextResponse.json({ plano: consultor.plano, plano_ativo_ate: consultor.plano_ativo_ate, cobranca_ativa: false, valor: 0, isento_pelo_time: true });
  }

  // Associacao cobra o consultor diretamente
  if (assoc?.cobranca_ativa && Number(assoc.valor_mensalidade_consultor_pro ?? 0) > 0) {
    return NextResponse.json({
      plano: consultor.plano,
      plano_ativo_ate: consultor.plano_ativo_ate,
      cobranca_ativa: true,
      valor: Number(assoc.valor_mensalidade_consultor_pro),
      cobrador: "associacao",
    });
  }

  // Master cobra o consultor
  if (mc?.cobranca_consultor_ativa) {
    return NextResponse.json({
      plano: consultor.plano,
      plano_ativo_ate: consultor.plano_ativo_ate,
      cobranca_ativa: true,
      valor: Number(mc.valor_consultor_mensal ?? 0),
      valor_anual: Number(mc.valor_consultor_anual ?? 0),
      cobrador: "master",
    });
  }

  // Gratuito
  return NextResponse.json({ plano: consultor.plano, plano_ativo_ate: consultor.plano_ativo_ate, cobranca_ativa: false, valor: 0 });
}

// POST: inicia upgrade
export async function POST(req: NextRequest) {
  const consultor = await autenticar();
  if (!consultor) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  // Considera "ja pro" apenas se o plano ainda estiver dentro da validade
  const planoAtivo = consultor.plano === "pro" && consultor.plano_ativo_ate && new Date(consultor.plano_ativo_ate) > new Date();
  if (planoAtivo) {
    return NextResponse.json({ ok: true, ja_pro: true, plano_ativo_ate: consultor.plano_ativo_ate });
  }

  let body: unknown;
  try { body = await req.json(); } catch { body = {}; }
  const { tipo_periodo } = (body as { tipo_periodo?: string }) ?? {};
  const isAnual = tipo_periodo === "anual";

  const [assocRes, masterConfigRes] = await Promise.all([
    consultor.associacao_id
      ? supabaseAdmin
          .from("associacoes")
          .select("id, nome, cobranca_ativa, valor_mensalidade_consultor_pro, paga_pelo_time, efi_client_id, efi_client_secret, efi_pix_key, efi_certificate_base64")
          .eq("id", consultor.associacao_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabaseAdmin
      .from("configuracoes_master")
      .select("cobranca_consultor_ativa, valor_consultor_mensal, valor_consultor_anual")
      .eq("id", 1)
      .maybeSingle(),
  ]);

  const assoc = assocRes.data;
  const mc = masterConfigRes.data;

  // --- CAMINHO 1: Associacao paga pelo time → isento ---
  if (assoc?.paga_pelo_time) {
    const planoAte = new Date();
    planoAte.setDate(planoAte.getDate() + 30);
    await supabaseAdmin.from("consultores").update({ plano: "pro", plano_ativo_ate: planoAte.toISOString() }).eq("id", consultor.id);
    return NextResponse.json({ ok: true, gratuito: true, motivo: "isento_pelo_time" });
  }

  // --- CAMINHO 2: Associacao cobra o consultor diretamente ---
  if (assoc?.cobranca_ativa && Number(assoc.valor_mensalidade_consultor_pro ?? 0) > 0) {
    const valor = Number(assoc.valor_mensalidade_consultor_pro);

    if (!assoc.efi_client_id || !assoc.efi_client_secret || !assoc.efi_pix_key || !assoc.efi_certificate_base64) {
      return NextResponse.json({ error: "Configuracao de pagamento da associacao incompleta. Contate o administrador." }, { status: 422 });
    }

    try {
      const efi = new EfiPay({
        sandbox: false,
        client_id: assoc.efi_client_id as string,
        client_secret: assoc.efi_client_secret as string,
        certificate: assoc.efi_certificate_base64 as string,
        cert_base64: true,
      });

      const { qrcode, qrcode_image, txid } = await gerarPix(efi, assoc.efi_pix_key as string, valor, `Consultor Pro - ${assoc.nome ?? "Indique Placa"}`);

      await supabaseAdmin.from("cobrancas").insert({
        usuario_id: consultor.id,
        usuario_tipo: "consultor",
        associacao_id: assoc.id,
        txid,
        valor,
        status: "pendente",
        tipo_periodo: "mensal",
      });

      return NextResponse.json({ ok: true, qrcode, qrcode_image, txid, valor });
    } catch (err) {
      console.error("[upgrade-pro] Efi associacao:", err);
      return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao gerar PIX" }, { status: 500 });
    }
  }

  // --- CAMINHO 3: Master cobra o consultor ---
  if (mc?.cobranca_consultor_ativa) {
    const valor = isAnual ? Number(mc.valor_consultor_anual ?? 0) : Number(mc.valor_consultor_mensal ?? 0);
    if (valor === 0) {
      // Valor zero = gratuito pelo master
      const planoAte = new Date();
      isAnual ? planoAte.setFullYear(planoAte.getFullYear() + 1) : planoAte.setDate(planoAte.getDate() + 30);
      await supabaseAdmin.from("consultores").update({ plano: "pro", plano_ativo_ate: planoAte.toISOString() }).eq("id", consultor.id);
      return NextResponse.json({ ok: true, gratuito: true });
    }

    if (!masterEfiConfigurado()) {
      return NextResponse.json({ error: "Sistema de pagamento do master nao configurado. Contate o suporte." }, { status: 422 });
    }

    try {
      const efi = criarEfiMaster();
      const pixKey = process.env.MASTER_EFI_PIX_KEY!;
      const descricao = isAnual ? "Consultor Pro Anual - Indique Placa" : "Consultor Pro Mensal - Indique Placa";
      const { qrcode, qrcode_image, txid } = await gerarPix(efi, pixKey, valor, descricao);

      await supabaseAdmin.from("cobrancas").insert({
        usuario_id: consultor.id,
        usuario_tipo: "consultor",
        associacao_id: consultor.associacao_id ?? null,
        txid,
        valor,
        status: "pendente",
        tipo_periodo: isAnual ? "anual" : "mensal",
      });

      return NextResponse.json({ ok: true, qrcode, qrcode_image, txid, valor, cobrador: "master" });
    } catch (err) {
      console.error("[upgrade-pro] Efi master:", err);
      return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao gerar PIX" }, { status: 500 });
    }
  }

  // --- CAMINHO 4: Gratuito (nenhuma cobranca ativa) ---
  const planoAte = new Date();
  planoAte.setDate(planoAte.getDate() + 30);
  await supabaseAdmin.from("consultores").update({ plano: "pro", plano_ativo_ate: planoAte.toISOString() }).eq("id", consultor.id);
  return NextResponse.json({ ok: true, gratuito: true });
}
