import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "./supabase-server";

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

export async function criarSessao(usuario_id: string, tipo: "consultor" | "indicador" | "gestor" | "associacao"): Promise<string> {
  const expira = Date.now() + DURACAO_HORAS * 60 * 60 * 1000;
  const id = crypto.randomUUID();
  const payload = JSON.stringify({ id, usuario_id, tipo, expira });
  const b64 = Buffer.from(payload).toString("base64url");
  const sig = assinar(b64);
  return `${b64}.${sig}`;
}

export async function validarSessao(token: string, tipo: "consultor" | "indicador" | "gestor" | "associacao"): Promise<string | null> {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return null;
    const b64 = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const sigEsperada = assinar(b64);
    if (sig.length !== sigEsperada.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(sigEsperada))) return null;

    const payload = JSON.parse(Buffer.from(b64, "base64url").toString());
    if (payload.tipo !== tipo) return null;
    if (Date.now() > payload.expira) return null;

    if (payload.id) {
      const { data } = await supabaseAdmin
        .from("sessoes_revogadas")
        .select("id")
        .eq("session_id", payload.id)
        .maybeSingle();
      if (data) return null;
    }

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
    const sig = token.slice(dot + 1);

    // Verifica assinatura antes de confiar no payload
    const sigEsperada = assinar(b64);
    if (sig.length !== sigEsperada.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(sigEsperada))) return;

    const payload = JSON.parse(Buffer.from(b64, "base64url").toString());
    if (payload.id && payload.expira) {
      await supabaseAdmin.from("sessoes_revogadas").insert({
        session_id: payload.id,
        expira_em: new Date(payload.expira).toISOString(),
      });
    }
  } catch {
    // Token malformado; nao ha o que revogar
  }
}
