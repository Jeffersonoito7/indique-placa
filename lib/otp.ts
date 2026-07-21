import "server-only";
import { supabaseAdmin } from "./supabase-server";

type TipoOTP = "consultor" | "gestor" | "indicador";

export async function criarOTP(email: string, tipo: TipoOTP): Promise<string> {
  const codigo = String(Math.floor(100000 + Math.random() * 900000));
  const expiraEm = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  // Invalida tokens anteriores do mesmo email+tipo
  await supabaseAdmin
    .from("otp_tokens")
    .update({ usado: true })
    .eq("email", email)
    .eq("tipo", tipo)
    .eq("usado", false);

  await supabaseAdmin.from("otp_tokens").insert({
    email,
    tipo,
    codigo,
    expira_em: expiraEm,
  });

  return codigo;
}

export async function validarOTP(
  email: string,
  tipo: TipoOTP,
  codigo: string
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("otp_tokens")
    .select("id, expira_em, usado")
    .eq("email", email)
    .eq("tipo", tipo)
    .eq("codigo", codigo)
    .eq("usado", false)
    .order("criado_em", { ascending: false })
    .limit(1)
    .single();

  if (!data) return false;
  if (new Date(data.expira_em) < new Date()) return false;

  // Marca como usado
  await supabaseAdmin
    .from("otp_tokens")
    .update({ usado: true })
    .eq("id", data.id);

  return true;
}
