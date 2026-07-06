import "server-only";
import { createHmac } from "crypto";

const DURACAO_HORAS = 8;

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET nao configurado. Defina esta variavel de ambiente no Vercel.");
    }
    return "indique-placa-secret-dev-only";
  }
  return secret;
}

function assinar(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

// Blocklist de sessoes revogadas (IDs de sessao).
// Limitacao: em memoria por instancia — nao persiste entre reinicializacoes nem
// funciona em multi-instancia (ex: Vercel com multiplas regioes). Para producao
// de alta disponibilidade, substituir por Upstash Redis ou similar.
const sessoesBloqueadas = new Set<string>();

export async function criarSessao(usuario_id: string, tipo: "consultor" | "indicador"): Promise<string> {
  const expira = Date.now() + DURACAO_HORAS * 60 * 60 * 1000;
  const id = crypto.randomUUID();
  const payload = JSON.stringify({ id, usuario_id, tipo, expira });
  const b64 = Buffer.from(payload).toString("base64url");
  const sig = assinar(b64);
  return `${b64}.${sig}`;
}

export async function validarSessao(token: string, tipo: "consultor" | "indicador"): Promise<string | null> {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return null;
    const b64 = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    if (assinar(b64) !== sig) return null;

    const payload = JSON.parse(Buffer.from(b64, "base64url").toString());
    if (payload.tipo !== tipo) return null;
    if (Date.now() > payload.expira) return null;

    // Verifica blocklist apenas se a sessao tem id (sessoes antigas sem id sao
    // aceitas mas nao podem ser individualmente revogadas)
    if (payload.id && sessoesBloqueadas.has(payload.id)) return null;

    return payload.usuario_id;
  } catch {
    return null;
  }
}

export async function revogarSessao(token: string): Promise<void> {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return;
    const b64 = token.slice(0, dot);
    const payload = JSON.parse(Buffer.from(b64, "base64url").toString());
    if (payload.id) {
      sessoesBloqueadas.add(payload.id);
    }
  } catch {
    // Token malformado; nao ha o que revogar
  }
}
