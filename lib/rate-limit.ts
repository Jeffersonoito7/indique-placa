import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";

// Rate limiter persistido no Supabase — funciona em multi-instancia (Vercel serverless).
// Tabela: rate_limit_store. Funcao atomica: rate_limit_check (ver sql/rate_limit_store.sql).
// Fail-open: se o banco falhar, deixa a requisicao passar para nao bloquear usuarios legitimos.

export async function rateLimit(
  key: string,
  limite: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfter: number }> {
  const { data, error } = await supabaseAdmin.rpc("rate_limit_check", {
    p_key: key,
    p_limite: limite,
    p_window_ms: windowMs,
  });

  if (error) {
    console.error("[rate-limit] erro ao checar limite:", error.message);
    return { allowed: true, retryAfter: 0 };
  }

  const result = data as { allowed: boolean; retry_after: number };
  return { allowed: result.allowed, retryAfter: result.retry_after ?? 0 };
}

export function getRateLimitKey(req: Request, prefix: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return `${prefix}:${ip}`;
}
