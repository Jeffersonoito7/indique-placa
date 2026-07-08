import { NextRequest, NextResponse } from "next/server";
import { getIndicadorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { z } from "zod";

const schema = z.object({
  placa: z.string().min(7).max(7).regex(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/, "Placa inválida"),
  nome_lead: z.string().min(2).max(100),
  telefone_lead: z.string().min(10).max(20),
  tipo_veiculo: z.enum(["moto", "carro", "caminhao"]).default("carro"),
});

export async function POST(req: NextRequest) {
  const indicador = await getIndicadorLogado();
  if (!indicador) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisição inválida" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { placa, nome_lead, telefone_lead, tipo_veiculo } = parsed.data;

  if (!indicador.consultor_id) return NextResponse.json({ error: "Indicador sem consultor vinculado" }, { status: 400 });

  const tel = telefone_lead?.replace(/\D/g, "") ?? null;

  // Deduplicacao por placa dentro da carteira do consultor
  const { data: existente } = await supabaseAdmin
    .from("indicacoes")
    .select("id")
    .eq("consultor_id", indicador.consultor_id)
    .eq("placa", placa)
    .limit(1)
    .single();

  if (existente) return NextResponse.json({ error: "Esta placa já foi indicada anteriormente." }, { status: 409 });

  const { error } = await supabaseAdmin.from("indicacoes").insert({
    placa,
    nome_lead: nome_lead ?? null,
    telefone_lead: tel,
    consultor_id: indicador.consultor_id,
    indicador_id: indicador.id,
    tipo_veiculo: tipo_veiculo ?? "carro",
    status: "novo",
  });

  if (error) return NextResponse.json({ error: "Erro ao salvar indicação" }, { status: 500 });

  const { data: consultor } = await supabaseAdmin
    .from("consultores")
    .select("nome, fone")
    .eq("id", indicador.consultor_id)
    .single();

  // Disparo de push notification (falhas nao bloqueiam a resposta principal)
  void (async () => {
    try {
      const { data: subs } = await supabaseAdmin
        .from("push_subscriptions")
        .select("subscription")
        .eq("consultor_id", indicador.consultor_id);

      if (!subs || subs.length === 0) return;

      const webpush = await import("web-push");
      webpush.setVapidDetails(
        process.env.VAPID_EMAIL!,
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        process.env.VAPID_PRIVATE_KEY!
      );

      const payload = JSON.stringify({
        title: "Nova indicacao recebida!",
        body: `Placa ${placa} indicada por ${indicador.nome}`,
        url: "/consultor/leads",
      });

      await Promise.allSettled(
        subs.map((row) =>
          webpush.sendNotification(row.subscription as Parameters<typeof webpush.sendNotification>[0], payload)
        )
      );
    } catch (err) {
      console.error("Erro ao enviar push notification:", err);
    }
  })();

  return NextResponse.json({
    ok: true,
    consultor: consultor ? { nome: consultor.nome, fone: consultor.fone } : null,
  });
}
