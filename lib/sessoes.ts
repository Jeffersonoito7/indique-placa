import "server-only";
import { supabaseAdmin } from "./supabase-server";
import { randomBytes } from "crypto";

const DURACAO_HORAS = 8;

export async function criarSessao(usuario_id: string, tipo: "consultor" | "indicador"): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expira_em = new Date(Date.now() + DURACAO_HORAS * 60 * 60 * 1000).toISOString();

  const { error } = await supabaseAdmin.from("sessoes").insert({ token, usuario_id, tipo, expira_em });
  if (error) throw new Error("Erro ao criar sessao: " + error.message);

  return token;
}

export async function validarSessao(token: string, tipo: "consultor" | "indicador"): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("sessoes")
    .select("usuario_id, expira_em")
    .eq("token", token)
    .eq("tipo", tipo)
    .single();

  if (!data) return null;
  if (new Date(data.expira_em) < new Date()) {
    // Sessao expirada — remover do banco
    await supabaseAdmin.from("sessoes").delete().eq("token", token);
    return null;
  }

  return data.usuario_id;
}

export async function revogarSessao(token: string): Promise<void> {
  await supabaseAdmin.from("sessoes").delete().eq("token", token);
}
