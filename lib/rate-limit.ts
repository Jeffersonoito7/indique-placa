import "server-only";

// Rate limiter em memoria — funciona para instancia unica (Vercel Functions por region)
// Para multi-instancia em producao alta, substituir por Upstash Redis
const store = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limite: number, janelaSeg: number): boolean {
  const agora = Date.now();
  const entry = store.get(key);

  if (!entry || agora > entry.resetAt) {
    store.set(key, { count: 1, resetAt: agora + janelaSeg * 1000 });
    return true; // permitido
  }

  if (entry.count >= limite) return false; // bloqueado

  entry.count++;
  return true; // permitido
}
