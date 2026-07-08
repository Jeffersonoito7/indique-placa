import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";
import { validarSessao } from "@/lib/sessoes";
import { notificarLeadFechado } from "@/lib/whatsapp";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["novo", "contato", "fechado", "perdido"]),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("consultor_auth")?.value;
  if (!token) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const consultorId = await validarSessao(token, "consultor");
  if (!consultorId) return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });

  const { id } = await params;

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Dados inválidos" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Status inválido" }, { status: 400 });

  // Só pode alterar leads que pertencem a ele
  const { data: lead } = await supabaseAdmin
    .from("indicacoes")
    .select("id, consultor_id, nome_lead, placa, indicador_id")
    .eq("id", id)
    .single();

  if (!lead || lead.consultor_id !== consultorId) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
  }

  const { error } = await supabaseAdmin
    .from("indicacoes")
    .update({ status: parsed.data.status })
    .eq("id", id);

  if (error) return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });

  // Notifica consultor quando lead é fechado
  let indicadorRetorno: { nome: string; telefone: string | null; chave_pix: string | null; comissao: number | null } | null = null;

  if (parsed.data.status === "fechado") {
    const { data: consultor } = await supabaseAdmin
      .from("consultores")
      .select("nome, fone")
      .eq("id", consultorId)
      .single();
    if (consultor) {
      notificarLeadFechado({
        nomeConsultor: consultor.nome,
        telefoneConsultor: consultor.fone,
        nomeLead: lead.nome_lead ?? "",
      }).catch(() => {});
    }

    // Busca indicador para retornar dados e enviar push
    if (lead.indicador_id) {
      const { data: indicador } = await supabaseAdmin
        .from("indicadores")
        .select("id, nome, telefone, chave_pix, comissao")
        .eq("id", lead.indicador_id)
        .single();

      if (indicador) {
        indicadorRetorno = {
          nome: indicador.nome,
          telefone: indicador.telefone ?? null,
          chave_pix: indicador.chave_pix ?? null,
          comissao: indicador.comissao ?? null,
        };

        // Envia push notification ao indicador (falhas nao bloqueiam a resposta)
        void (async () => {
          try {
            const { data: subs } = await supabaseAdmin
              .from("push_subscriptions")
              .select("subscription")
              .eq("indicador_id", lead.indicador_id);

            if (!subs || subs.length === 0) return;

            const webpush = await import("web-push");
            webpush.setVapidDetails(
              process.env.VAPID_EMAIL!,
              process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
              process.env.VAPID_PRIVATE_KEY!
            );

            const placaTexto = lead.placa ?? "s/n";
            const comissaoTexto = indicador.comissao
              ? indicador.comissao.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
              : "a combinar";

            const payload = JSON.stringify({
              title: "Venda fechada!",
              body: `Sua indicacao da placa ${placaTexto} fechou. Voce ganhou ${comissaoTexto}!`,
              url: "/indicador/dashboard",
            });

            await Promise.allSettled(
              subs.map((row) =>
                webpush.sendNotification(row.subscription as Parameters<typeof webpush.sendNotification>[0], payload)
              )
            );
          } catch (err) {
            console.error("Erro ao enviar push notification ao indicador:", err);
          }
        })();
      }
    }
  }

  return NextResponse.json({ ok: true, ...(indicadorRetorno ? { indicador: indicadorRetorno } : {}) });
}
