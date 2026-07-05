import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.MASTER_TOKEN_SECRET ?? "fallback-insecure-dev-secret";

export function gerarToken(usuario: string): string {
  const payload = `${usuario}:${Date.now()}`;
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
    return timingSafeEqual(Buffer.from(mac, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}
