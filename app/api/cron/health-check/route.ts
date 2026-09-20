import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

type CheckStatus = "ok" | "warning" | "critical";

function calcStatus(valor: number, warning: number, critical: number): CheckStatus {
  if (valor >= critical) return "critical";
  if (valor >= warning) return "warning";
  return "ok";
}

async function enviarWhatsApp(numero: string, texto: string) {
  const evUrl = process.env.EVOLUTION_API_URL;
  const evKey = process.env.EVOLUTION_API_KEY;
  const evInstance = process.env.EVOLUTION_INSTANCE;
  if (!evUrl || !evKey || !evInstance) return;
  await fetch(`${evUrl}/message/sendText/${evInstance}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: evKey },
    body: JSON.stringify({ number: numero, text: texto }),
  }).catch(() => {});
}

export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Serviço indisponível" }, { status: 503 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const [
    { count: totalIndicacoes },
    { count: totalConsultores },
    { count: totalIndicadores },
    { count: totalOtp },
  ] = await Promise.all([
    supabaseAdmin.from("indicacoes").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("consultores").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("indicadores").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("otp_tokens").select("*", { count: "exact", head: true }).eq("usado", false).lt("expira_em", new Date().toISOString()),
  ]);

  const t0 = Date.now();
  await supabaseAdmin.from("indicacoes").select("id", { count: "exact", head: true });
  const latencia = Date.now() - t0;

  const alertas: string[] = [];

  const indStatus = calcStatus(totalIndicacoes ?? 0, 50000, 90000);
  if (indStatus !== "ok") alertas.push(`Indicações: ${totalIndicacoes} rows (limite 90k) — ${indStatus}`);

  const consStatus = calcStatus(totalConsultores ?? 0, 5000, 9000);
  if (consStatus !== "ok") alertas.push(`Consultores: ${totalConsultores} cadastrados (limite 9k) — ${consStatus}`);

  const indadStatus = calcStatus(totalIndicadores ?? 0, 10000, 18000);
  if (indadStatus !== "ok") alertas.push(`Indicadores: ${totalIndicadores} cadastrados (limite 18k) — ${indadStatus}`);

  const otpStatus = calcStatus(totalOtp ?? 0, 200, 1000);
  if (otpStatus !== "ok") alertas.push(`OTPs expirados sem limpeza: ${totalOtp} — executar limpeza`);

  const latStatus = calcStatus(latencia, 2000, 5000);
  if (latStatus !== "ok") alertas.push(`Latência do banco: ${latencia}ms — banco lento`);

  if (alertas.length === 0) {
    return NextResponse.json({ ok: true, status: "ok", checks: 5 });
  }

  // Envia alerta ao numero master configurado
  const numeroMaster = process.env.MASTER_WHATSAPP_ALERTA;
  if (numeroMaster) {
    const nivel = alertas.some((a) => a.includes("critical")) ? "CRÍTICO" : "ATENÇÃO";
    const texto =
      `*[IndiquePlaca] Alerta de Saúde do Sistema — ${nivel}*\n\n` +
      alertas.map((a) => `- ${a}`).join("\n") +
      `\n\nVerifique: https://indiqueplaca.com.br/master/health`;
    await enviarWhatsApp(numeroMaster, texto);
  }

  console.warn("[health-check] alertas enviados:", alertas);
  return NextResponse.json({ ok: true, status: "warning", alertas });
}
