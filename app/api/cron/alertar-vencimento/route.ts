import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET) {
    console.error("[cron] CRON_SECRET nao configurado — endpoint bloqueado");
    return NextResponse.json({ error: "Servico indisponivel" }, { status: 503 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const baseUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE;
  if (!baseUrl || !apiKey || !instance) {
    return NextResponse.json({ ok: true, aviso: "Evolution nao configurado" });
  }

  // Consultores com plano Pro vencendo nos proximos 3 dias
  const em3Dias = new Date();
  em3Dias.setDate(em3Dias.getDate() + 3);
  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);

  // Filtra tambem por alerta_vencimento_enviado_em para evitar spam no mesmo dia
  const inicioDoDia = new Date();
  inicioDoDia.setHours(0, 0, 0, 0);

  const { data: consultores } = await supabaseAdmin
    .from("consultores")
    .select("id, nome, fone, plano_ativo_ate, alerta_vencimento_enviado_em")
    .eq("plano", "pro")
    .lte("plano_ativo_ate", em3Dias.toISOString())
    .gte("plano_ativo_ate", amanha.toISOString());

  if (!consultores || consultores.length === 0) {
    return NextResponse.json({ ok: true, enviados: 0 });
  }

  let enviados = 0;
  for (const c of consultores) {
    // Evita reenvio para o mesmo consultor no mesmo dia (deduplicacao)
    const ultimoEnvio = c.alerta_vencimento_enviado_em ? new Date(c.alerta_vencimento_enviado_em as string) : null;
    if (ultimoEnvio && ultimoEnvio >= inicioDoDia) continue;

    const diasRestantes = Math.ceil(
      (new Date(c.plano_ativo_ate as string).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    const numero = String(c.fone).replace(/\D/g, "");
    const numeroFormatado = numero.startsWith("55") ? numero : `55${numero}`;
    const msg = `Ola ${c.nome}! Seu plano Pro do Indique Placa vence em ${diasRestantes} dia${diasRestantes === 1 ? "" : "s"}. Acesse indiqueplaca.com.br/consultor/upgrade para renovar e manter todos os seus recursos ativos.`;

    try {
      const res = await fetch(`${baseUrl}/message/sendText/${instance}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: apiKey },
        body: JSON.stringify({ number: numeroFormatado, text: msg }),
      });
      if (res.ok) {
        enviados++;
        // Registra data do envio para deduplicacao futura
        await supabaseAdmin
          .from("consultores")
          .update({ alerta_vencimento_enviado_em: new Date().toISOString() })
          .eq("id", c.id);
      }
    } catch {
      // ignora erro individual, continua para o proximo
    }
  }

  return NextResponse.json({ ok: true, enviados, total: consultores.length });
}
