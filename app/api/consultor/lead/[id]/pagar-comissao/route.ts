import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";
import { validarSessao } from "@/lib/sessoes";
import { enviarPixIndicador } from "@/lib/efi-pix";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("consultor_auth")?.value;
  if (!token) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const consultorId = await validarSessao(token, "consultor");
  if (!consultorId) return NextResponse.json({ error: "Sessao expirada" }, { status: 401 });

  const { id } = await params;

  // Busca lead com dados do indicador e associacao
  const { data: lead } = await supabaseAdmin
    .from("indicacoes")
    .select("id, consultor_id, indicador_id, comissao_valor, status, comissao_paga")
    .eq("id", id)
    .single();

  if (!lead || lead.consultor_id !== consultorId) {
    return NextResponse.json({ error: "Lead nao encontrado" }, { status: 404 });
  }

  if (lead.status !== "fechado") {
    return NextResponse.json({ error: "So e possivel pagar comissao de leads fechados" }, { status: 400 });
  }

  if (lead.comissao_paga) {
    return NextResponse.json({ ok: true, ja_pago: true });
  }

  // Busca chave PIX do indicador
  const indicadorId = lead.indicador_id;
  let chavePix: string | null = null;
  if (indicadorId) {
    const { data: indicador } = await supabaseAdmin
      .from("indicadores")
      .select("chave_pix")
      .eq("id", indicadorId)
      .maybeSingle();
    chavePix = indicador?.chave_pix ?? null;
  }

  const valorComissao = Number(lead.comissao_valor ?? 0);
  let pixEnviado = false;
  let pixStatus: string | undefined;
  let pixErro: string | undefined;

  // Marca como pago ANTES de chamar o PIX — UPDATE atomico garante que apenas um
  // request concorrente prossegue; o segundo retorna ja_pago sem disparar PIX duplo
  const { data: updated, error: errUpdate } = await supabaseAdmin
    .from("indicacoes")
    .update({
      comissao_paga: true,
      comissao_paga_em: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("consultor_id", consultorId)
    .eq("comissao_paga", false)
    .select("id");

  if (errUpdate) return NextResponse.json({ error: "Erro ao registrar pagamento" }, { status: 500 });

  if (!updated || updated.length === 0) {
    return NextResponse.json({ ok: true, ja_pago: true });
  }

  // Tenta envio PIX automatico se indicador tem chave PIX e valor > 0
  if (chavePix && valorComissao > 0) {
    const { data: consultor } = await supabaseAdmin
      .from("consultores")
      .select("associacao_id")
      .eq("id", consultorId)
      .maybeSingle();

    if (consultor?.associacao_id) {
      const { data: assoc } = await supabaseAdmin
        .from("associacoes")
        .select("efi_client_id, efi_client_secret, efi_certificate_base64, efi_pix_key")
        .eq("id", consultor.associacao_id)
        .single();

      if (
        assoc?.efi_client_id &&
        assoc?.efi_client_secret &&
        assoc?.efi_certificate_base64 &&
        assoc?.efi_pix_key
      ) {
        // idEnvio: uuid sem hifens, max 35 chars (exigencia Efi)
        const idEnvio = id.replace(/-/g, "").slice(0, 35);

        try {
          const resultado = await enviarPixIndicador({
            credenciais: {
              client_id: assoc.efi_client_id as string,
              client_secret: assoc.efi_client_secret as string,
              certificate_base64: assoc.efi_certificate_base64 as string,
              pix_key: assoc.efi_pix_key as string,
            },
            chaveDestino: chavePix,
            valorReais: valorComissao,
            idEnvio,
            descricao: "Comissao indicacao - Indique Placa",
          });

          pixEnviado = resultado.ok;
          pixStatus = resultado.status;
          if (!resultado.ok) {
            pixErro = resultado.erro ?? `Status Efi: ${resultado.status}`;
            console.error("[pagar-comissao] PIX falhou apos marcar pago", id, pixErro);
          }
        } catch (err: unknown) {
          pixErro = err instanceof Error ? err.message : "Erro ao enviar PIX";
          console.error("[pagar-comissao] Excecao Efi pixSend:", err);
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    pix_enviado: pixEnviado,
    pix_status: pixStatus,
    pix_erro: pixErro,
    sem_chave_pix: !chavePix,
    sem_configuracao: !pixEnviado && !pixErro,
  });
}
