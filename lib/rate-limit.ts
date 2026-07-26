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
  // No Vercel, x-real-ip e injetado pela infra e nao pode ser forjado pelo cliente.
  // Fallback para o ULTIMO IP de x-forwarded-for (tambem injetado pelo Vercel).
  // Nunca usar o primeiro IP de x-forwarded-for pois o cliente pode forja-lo.
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return `${prefix}:${realIp.trim()}`;

  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",").at(-1)?.trim() ?? "unknown" : "unknown";
  return `${prefix}:${ip}`;
}
