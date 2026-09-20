import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Serviço indisponível" }, { status: 503 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const duasHorasAtras = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const agora = new Date().toISOString();

  const [otpResult, rateLimitResult, sessoesResult] = await Promise.all([
    // Remove OTPs usados ou expirados ha mais de 1 hora
    supabaseAdmin
      .from("otp_tokens")
      .delete()
      .or(`usado.eq.true,expira_em.lt.${umaHoraAtras}`),
    // Remove entradas de rate limit expiradas ha mais de 2 horas
    supabaseAdmin
      .from("rate_limit_store")
      .delete()
      .lt("reset_at", duasHorasAtras),
    // Remove sessoes revogadas ja expiradas (evita crescimento indefinido da tabela)
    supabaseAdmin
      .from("sessoes_revogadas")
      .delete()
      .lt("expira_em", agora),
  ]);

  const erros: string[] = [];
  if (otpResult.error) erros.push(`otp_tokens: ${otpResult.error.message}`);
  if (rateLimitResult.error) erros.push(`rate_limit_store: ${rateLimitResult.error.message}`);
  if (sessoesResult.error) erros.push(`sessoes_revogadas: ${sessoesResult.error.message}`);

  if (erros.length > 0) {
    console.error("[cleanup] erros:", erros);
    return NextResponse.json({ ok: false, erros }, { status: 500 });
  }

  console.log("[cleanup] limpeza concluída");
  return NextResponse.json({ ok: true });
}
