import "server-only";
import { cookies } from "next/headers";
import { supabaseAdmin } from "./supabase-server";
import { validarSessao } from "./sessoes";

export async function getConsultorLogado() {
  const cookieStore = await cookies();
  const token = cookieStore.get("consultor_auth")?.value;
  if (!token) return null;

  const usuario_id = await validarSessao(token, "consultor");
  if (!usuario_id) return null;

  const { data } = await supabaseAdmin
    .from("consultores")
    .select("id, nome, fone, email, status")
    .eq("id", usuario_id)
    .single();

  return data ?? null;
}

export async function getGestorLogado() {
  const cookieStore = await cookies();
  const token = cookieStore.get("gestor_auth")?.value;
  if (!token) return null;

  const usuario_id = await validarSessao(token, "gestor");
  if (!usuario_id) return null;

  const { data } = await supabaseAdmin
    .from("gestores")
    .select("id, nome, fone, email, plano, plano_ativo_ate")
    .eq("id", usuario_id)
    .single();

  return data ?? null;
}

export async function getAssociacaoLogada() {
  const cookieStore = await cookies();
  const token = cookieStore.get("associacao_auth")?.value;
  if (!token) return null;

  const usuario_id = await validarSessao(token, "associacao");
  if (!usuario_id) return null;

  const { data } = await supabaseAdmin
    .from("associacoes")
    .select("id, nome, email, fone, cidade, estado, plano, status")
    .eq("id", usuario_id)
    .single();

  return data ?? null;
}

export async function getIndicadorLogado() {
  const cookieStore = await cookies();
  const token = cookieStore.get("indicador_auth")?.value;
  if (!token) return null;

  const usuario_id = await validarSessao(token, "indicador");
  if (!usuario_id) return null;

  const { data } = await supabaseAdmin
    .from("indicadores")
    .select("id, nome, telefone, consultor_id, chave_pix")
    .eq("id", usuario_id)
    .single();

  return data ?? null;
}
