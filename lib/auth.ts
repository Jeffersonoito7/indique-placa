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

export async function getIndicadorLogado() {
  const cookieStore = await cookies();
  const token = cookieStore.get("indicador_auth")?.value;
  if (!token) return null;

  const usuario_id = await validarSessao(token, "indicador");
  if (!usuario_id) return null;

  const { data } = await supabaseAdmin
    .from("indicadores")
    .select("id, nome, telefone, consultor_id")
    .eq("id", usuario_id)
    .single();

  return data ?? null;
}
