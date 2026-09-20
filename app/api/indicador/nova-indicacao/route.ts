import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getIndicadorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { verificarBloqueioConsultor } from "@/lib/consultor-status";
import { notificarLeadDeIndicadorParaGestor } from "@/lib/whatsapp";
import { z } from "zod";

const schema = z.object({
  placa: z.string().min(7).max(7).regex(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/, "Placa inválida"),
  nome_lead: z.string().min(2).max(100),
  telefone_lead: z.string().min(10).max(20),
  tipo_veiculo: z.enum(["moto", "carro", "caminhao"]).default("carro"),
});

export async function POST(req: NextRequest) {
  const { allowed, retryAfter } = await rateLimit(getRateLimitKey(req, "nova-indicacao"), 20, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Muitas requisições. Tente novamente em breve." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  const indicador = await getIndicadorLogado();
  if (!indicador) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisição inválida" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { placa, nome_lead, telefone_lead, tipo_veiculo } = parsed.data;

  // Busca gestor_id do indicador para notificacao (getIndicadorLogado nao retorna esse campo)
  const { data: indicadorFull } = await supabaseAdmin
    .from("indicadores")
    .select("gestor_id")
    .eq("id", indicador.id)
    .maybeSingle();
  const gestorIdRecrutador = indicadorFull?.gestor_id ?? null;

  let consultorId: string | null = indicador.consultor_id ?? null;

  if (!consultorId) {
    const { data: cfg } = await supabaseAdmin
      .from("configuracoes")
      .select("consultor_padrao_id")
      .limit(1)
      .maybeSingle();
    consultorId = cfg?.consultor_padrao_id ?? null;
  }

  if (!consultorId) return NextResponse.json({ error: "Nenhum consultor disponível para receber indicações. Entre em contato com o administrador." }, { status: 400 });

  const bloqueio = await verificarBloqueioConsultor(consultorId);
  if (bloqueio.bloqueado) {
    const { data: consultorInfo } = await supabaseAdmin
      .from("consultores")
      .select("nome, fone")
      .eq("id", consultorId)
      .single();
    return NextResponse.json(
      {
        error: "Seu consultor está temporariamente bloqueado de receber novas indicações. Entre em contato com ele.",
        consultor_nome: consultorInfo?.nome ?? null,
      },
      { status: 403 }
    );
  }

  const tel = telefone_lead?.replace(/\D/g, "") ?? null;

  // Deduplicacao por placa dentro da carteira do consultor
  const { data: existente } = await supabaseAdmin
    .from("indicacoes")
    .select("id")
    .eq("consultor_id", consultorId)
    .eq("placa", placa)
    .limit(1)
    .maybeSingle();

  if (existente) return NextResponse.json({ error: "Esta placa já foi indicada anteriormente." }, { status: 409 });

  const { error } = await supabaseAdmin.from("indicacoes").insert({
    placa,
    nome_lead: nome_lead ?? null,
    telefone_lead: tel,
    consultor_id: consultorId,
    indicador_id: indicador.id,
    tipo_veiculo: tipo_veiculo ?? "carro",
    status: "novo",
  });

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Esta placa já foi indicada anteriormente." }, { status: 409 });
    return NextResponse.json({ error: "Erro ao salvar indicação" }, { status: 500 });
  }

  const { data: consultor } = await supabaseAdmin
    .from("consultores")
    .select("nome, fone")
    .eq("id", consultorId)
    .single();

  // WhatsApp ao consultor com dados do lead (aguarda antes de retornar — void fire-and-forget e cortado pela Vercel)
  try {
    const evUrl = process.env.EVOLUTION_API_URL;
    const evKey = process.env.EVOLUTION_API_KEY;
    const evInstance = process.env.EVOLUTION_INSTANCE;
    const foneConsultor = consultor?.fone?.replace(/\D/g, "");

    console.log("[nova-indicacao] wpp check:", { evUrl: !!evUrl, evKey: !!evKey, evInstance: !!evInstance, fone: !!foneConsultor });

    if (evUrl && evKey && evInstance && foneConsultor) {
      const numero = foneConsultor.startsWith("55") ? foneConsultor : `55${foneConsultor}`;
      const texto =
        `*Nova indicação recebida!*\n\n` +
        `Placa: *${placa}*\n` +
        `Cliente: ${nome_lead}\n` +
        `Telefone: ${telefone_lead}\n` +
        `Indicado por: ${indicador.nome}\n\n` +
        `Acesse: https://indiqueplaca.com.br/consultor/leads`;

      const resp = await fetch(`${evUrl}/message/sendText/${evInstance}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: evKey },
        body: JSON.stringify({ number: numero, text: texto }),
      });
      const respBody = await resp.text();
      console.log("[nova-indicacao] wpp resp:", resp.status, respBody);
    }
  } catch (err) {
    console.error("[nova-indicacao] erro ao enviar WhatsApp:", err);
  }

  // Se o indicador foi recrutado diretamente por um gestor, notifica o gestor tambem
  if (gestorIdRecrutador) {
    try {
      const evUrl = process.env.EVOLUTION_API_URL;
      const evKey = process.env.EVOLUTION_API_KEY;
      const evInstance = process.env.EVOLUTION_INSTANCE;

      if (evUrl && evKey && evInstance) {
        const { data: gestor } = await supabaseAdmin
          .from("gestores")
          .select("nome, fone")
          .eq("id", gestorIdRecrutador)
          .maybeSingle();

        const foneGestor = gestor?.fone?.replace(/\D/g, "");
        if (gestor && foneGestor) {
          await notificarLeadDeIndicadorParaGestor({
            nomeGestor: gestor.nome,
            telefoneGestor: foneGestor,
            nomeIndicador: indicador.nome,
            placa,
            nomeLead: nome_lead ?? null,
            telefoneLead: tel,
          });
        }
      }
    } catch (err) {
      console.error("[nova-indicacao] erro ao notificar gestor recrutador:", err);
    }
  }

  // Push notification via navegador (falha nao bloqueia a resposta)
  void (async () => {
    try {
      const { data: subs } = await supabaseAdmin
        .from("push_subscriptions")
        .select("subscription")
        .eq("consultor_id", consultorId);

      if (!subs || subs.length === 0) return;

      const webpush = await import("web-push");
      webpush.setVapidDetails(
        process.env.VAPID_EMAIL!,
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        process.env.VAPID_PRIVATE_KEY!
      );

      const payload = JSON.stringify({
        title: "Nova indicação recebida!",
        body: `Placa ${placa} indicada por ${indicador.nome}`,
        url: "/consultor/leads",
      });

      await Promise.allSettled(
        subs.map((row) =>
          webpush.sendNotification(row.subscription as Parameters<typeof webpush.sendNotification>[0], payload)
        )
      );
    } catch (err) {
      Sentry.captureException(err);
      console.error("Erro ao enviar push notification:", err);
    }
  })();

  return NextResponse.json({
    ok: true,
    consultor: consultor ? { nome: consultor.nome } : null,
  });
}
