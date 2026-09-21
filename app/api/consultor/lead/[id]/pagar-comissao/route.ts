import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";
import { validarSessao } from "@/lib/sessoes";
import { enviarPixIndicador } from "@/lib/efi-pix";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("consultor_auth")?.value;
  if (!token) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const consultorId = await validarSessao(token, "consultor");
  if (!consultorId) return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });

  const { id } = await params;

  // Busca lead com dados do indicador e associacao
  const { data: lead } = await supabaseAdmin
    .from("indicacoes")
    .select("id, consultor_id, indicador_id, comissao_valor, status, comissao_paga")
    .eq("id", id)
    .single();

  if (!lead || lead.consultor_id !== consultorId) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
  }

  if (lead.status !== "fechado") {
    return NextResponse.json({ error: "Só é possível pagar comissão de leads fechados" }, { status: 400 });
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

  // RESERVA o pagamento antes de chamar o PIX. O UPDATE condicional continua
  // impedindo envio duplo em cliques simultaneos, mas sem afirmar que ja pagou:
  // "pago" agora e estado final, alcancado so pela confirmacao.
  //
  // Antes, este trecho marcava comissao_paga = true aqui. Se a Efi recusasse, a
  // comissao ficava paga para sempre sem dinheiro ter saido.
  const { data: updated, error: errUpdate } = await supabaseAdmin
    .from("indicacoes")
    .update({ pix_status: "reservado" })
    .eq("id", id)
    .eq("consultor_id", consultorId)
    .in("pix_status", ["pendente", "falhou"])
    .select("id");

  if (errUpdate) return NextResponse.json({ error: "Erro ao registrar pagamento" }, { status: 500 });

  // A reserva nao pegou: outro estado ja ocupa o registro. Responder "ja pago"
  // aqui seria mentira quando o estado e "enviado" ou "reservado", porque o
  // dinheiro ainda nao foi confirmado. O consultor precisa saber a diferenca.
  if (!updated || updated.length === 0) {
    const { data: atual } = await supabaseAdmin
      .from("indicacoes")
      .select("pix_status")
      .eq("id", id)
      .maybeSingle();

    const estado = (atual as { pix_status?: string } | null)?.pix_status ?? "desconhecido";

    if (estado === "confirmado" || estado === "manual") {
      return NextResponse.json({ ok: true, ja_pago: true, pix_status: estado });
    }

    return NextResponse.json({
      ok: true,
      ja_pago: false,
      em_andamento: true,
      pix_status: estado,
    });
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
            descricao: "Comissão indicação - Indique Placa",
          });

          pixEnviado = resultado.ok;
          pixStatus = resultado.status;

          if (resultado.ok) {
            await supabaseAdmin
              .from("indicacoes")
              .update({ pix_status: "enviado", pix_id_envio: idEnvio, pix_erro: null })
              .eq("id", id);
          } else {
            pixErro = resultado.erro ?? `Status Efi: ${resultado.status}`;
            // Volta para falhou: o consultor pode tentar de novo, e a comissao
            // NAO fica registrada como paga.
            await supabaseAdmin
              .from("indicacoes")
              .update({ pix_status: "falhou", pix_erro: pixErro })
              .eq("id", id);
            console.error("[pagar-comissao] PIX recusado", id, pixErro);
          }
        } catch (err: unknown) {
          pixErro = err instanceof Error ? err.message : "Erro ao enviar PIX";
          await supabaseAdmin
            .from("indicacoes")
            .update({ pix_status: "falhou", pix_erro: pixErro })
            .eq("id", id);
          console.error("[pagar-comissao] Excecao Efi pixSend:", err);
        }
      }
    }
  }

  // Sem chave PIX ou sem configuracao da associacao nao ha o que enviar. Soltar
  // a reserva evita deixar o registro travado em "reservado" para sempre, que
  // seria dinheiro parado sem ninguem perceber.
  if (!pixEnviado && !pixErro) {
    await supabaseAdmin
      .from("indicacoes")
      .update({ pix_status: "pendente" })
      .eq("id", id)
      .eq("pix_status", "reservado");
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
