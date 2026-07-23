import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { verificarToken } from "@/lib/master-token";

function auth(req: NextRequest) {
  return verificarToken(req.cookies.get("master_auth")?.value ?? "");
}

type CheckStatus = "ok" | "warning" | "critical";

type Check = {
  nome: string;
  valor: number;
  limite: number | null;
  unidade: string;
  status: CheckStatus;
  mensagem: string;
};

function calcStatus(valor: number, warning: number, critical: number): CheckStatus {
  if (valor >= critical) return "critical";
  if (valor >= warning) return "warning";
  return "ok";
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const checks: Check[] = [];

  // Check: total rows indicacoes
  const { count: totalIndicacoes } = await supabaseAdmin
    .from("indicacoes")
    .select("*", { count: "exact", head: true });

  const indStatus = calcStatus(totalIndicacoes ?? 0, 50000, 90000);
  checks.push({
    nome: "Rows em indicacoes",
    valor: totalIndicacoes ?? 0,
    limite: 90000,
    unidade: "rows",
    status: indStatus,
    mensagem: indStatus === "ok"
      ? `${totalIndicacoes ?? 0} rows — dentro do limite`
      : indStatus === "warning"
      ? `${totalIndicacoes ?? 0} rows — aproximando do limite (90k)`
      : `${totalIndicacoes ?? 0} rows — limite critico atingido`,
  });

  // Check: total rows consultores
  const { count: totalConsultores } = await supabaseAdmin
    .from("consultores")
    .select("*", { count: "exact", head: true });

  const consStatus = calcStatus(totalConsultores ?? 0, 5000, 9000);
  checks.push({
    nome: "Rows em consultores",
    valor: totalConsultores ?? 0,
    limite: 9000,
    unidade: "rows",
    status: consStatus,
    mensagem: consStatus === "ok"
      ? `${totalConsultores ?? 0} consultores cadastrados`
      : consStatus === "warning"
      ? `${totalConsultores ?? 0} consultores — aproximando do limite`
      : `${totalConsultores ?? 0} consultores — limite critico`,
  });

  // Check: total rows indicadores
  const { count: totalIndicadores } = await supabaseAdmin
    .from("indicadores")
    .select("*", { count: "exact", head: true });

  const indadStatus = calcStatus(totalIndicadores ?? 0, 10000, 18000);
  checks.push({
    nome: "Rows em indicadores",
    valor: totalIndicadores ?? 0,
    limite: 18000,
    unidade: "rows",
    status: indadStatus,
    mensagem: indadStatus === "ok"
      ? `${totalIndicadores ?? 0} indicadores cadastrados`
      : indadStatus === "warning"
      ? `${totalIndicadores ?? 0} indicadores — aproximando do limite`
      : `${totalIndicadores ?? 0} indicadores — limite critico`,
  });

  // Check: acumulo de otp_tokens
  const { count: totalOtp } = await supabaseAdmin
    .from("otp_tokens")
    .select("*", { count: "exact", head: true });

  const otpStatus = calcStatus(totalOtp ?? 0, 1000, 5000);
  checks.push({
    nome: "Rows em otp_tokens",
    valor: totalOtp ?? 0,
    limite: 1000,
    unidade: "rows",
    status: otpStatus,
    mensagem: otpStatus === "ok"
      ? `${totalOtp ?? 0} tokens — dentro do normal`
      : `${totalOtp ?? 0} tokens acumulados — possivel vazamento de OTPs nao limpos`,
  });

  // Check: OTPs expirados nao usados
  const { count: otpsExpirados } = await supabaseAdmin
    .from("otp_tokens")
    .select("*", { count: "exact", head: true })
    .lt("expira_em", new Date().toISOString())
    .eq("usado", false);

  const otpExpStatus = calcStatus(otpsExpirados ?? 0, 100, 500);
  checks.push({
    nome: "OTPs expirados nao limpos",
    valor: otpsExpirados ?? 0,
    limite: 100,
    unidade: "tokens",
    status: otpExpStatus,
    mensagem: otpExpStatus === "ok"
      ? `${otpsExpirados ?? 0} OTPs expirados — normal`
      : `${otpsExpirados ?? 0} OTPs expirados sem limpeza — executar job de limpeza`,
  });

  // Check: tempo de resposta de query em indicacoes
  const t0 = Date.now();
  await supabaseAdmin.from("indicacoes").select("id", { count: "exact", head: true });
  const latencia = Date.now() - t0;

  const latStatus = calcStatus(latencia, 2000, 5000);
  checks.push({
    nome: "Latencia query indicacoes",
    valor: latencia,
    limite: 5000,
    unidade: "ms",
    status: latStatus,
    mensagem: latStatus === "ok"
      ? `${latencia}ms — resposta normal`
      : latStatus === "warning"
      ? `${latencia}ms — resposta lenta, verificar indices`
      : `${latencia}ms — resposta critica, banco pode estar sobrecarregado`,
  });

  const globalStatus: CheckStatus = checks.some((c) => c.status === "critical")
    ? "critical"
    : checks.some((c) => c.status === "warning")
    ? "warning"
    : "ok";

  return NextResponse.json({
    status: globalStatus,
    checks,
    timestamp: new Date().toISOString(),
  });
}
