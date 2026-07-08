import "server-only";

// Rate limiter em memoria — funciona para instancia unica (Vercel Functions por region).
// Para multi-instancia em alta escala, substituir por Upstash Redis sem mudar a interface.

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export function rateLimit(
  key: string,
  limite: number,
  windowMs: number
): { allowed: boolean; retryAfter: number } {
  const agora = Date.now();
  const entry = store.get(key);

  if (!entry || agora > entry.resetAt) {
    store.set(key, { count: 1, resetAt: agora + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  if (entry.count >= limite) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - agora) / 1000) };
  }

  entry.count++;
  return { allowed: true, retryAfter: 0 };
}

export function getRateLimitKey(req: Request, prefix: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return `${prefix}:${ip}`;
}
