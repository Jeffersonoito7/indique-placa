import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.MASTER_TOKEN_SECRET ?? "fallback-insecure-dev-secret";
const DURACAO_MS = 8 * 60 * 60 * 1000;

export function gerarToken(usuario: string): string {
  const expira = Date.now() + DURACAO_MS;
  const payload = `${usuario}:${expira}`;
  const mac = createHmac("sha256", SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}:${mac}`).toString("base64url");
}

export function verificarToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const lastColon = decoded.lastIndexOf(":");
    const payload = decoded.slice(0, lastColon);
    const mac = decoded.slice(lastColon + 1);
    const expected = createHmac("sha256", SECRET).update(payload).digest("hex");
    if (!timingSafeEqual(Buffer.from(mac, "hex"), Buffer.from(expected, "hex"))) return false;

    const parts = payload.split(":");
    const expira = parseInt(parts[parts.length - 1], 10);
    if (isNaN(expira) || Date.now() > expira) return false;

    return true;
  } catch {
    return false;
  }
}
