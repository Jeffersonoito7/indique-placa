import "server-only";
import { randomInt } from "crypto";
import { supabaseAdmin } from "./supabase-server";

type TipoOTP = "consultor" | "gestor" | "indicador" | "associacao" | "master";

export async function criarOTP(email: string, tipo: TipoOTP): Promise<string> {
  const codigo = String(randomInt(100000, 1000000));
  const expiraEm = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  // Invalida tokens anteriores do mesmo email+tipo (falha nao e bloqueante)
  const { error: invalidErr } = await supabaseAdmin
    .from("otp_tokens")
    .update({ usado: true })
    .eq("email", email)
    .eq("tipo", tipo)
    .eq("usado", false);

  if (invalidErr) {
    console.error("[otp] Falha ao invalidar OTPs anteriores:", invalidErr.message);
  }

  const { error: insertErr } = await supabaseAdmin.from("otp_tokens").insert({
    email,
    tipo,
    codigo,
    expira_em: expiraEm,
  });

  if (insertErr) {
    throw new Error(`Falha ao criar OTP: ${insertErr.message}`);
  }

  return codigo;
}

export async function validarOTP(
  email: string,
  tipo: TipoOTP,
  codigo: string
): Promise<boolean> {
  // UPDATE atomico: se duas requisicoes chegarem ao mesmo tempo apenas uma
  // encontrara usado=false e marcara como usado. A outra recebera array vazio.
  const { data: updated } = await supabaseAdmin
    .from("otp_tokens")
    .update({ usado: true })
    .eq("email", email)
    .eq("tipo", tipo)
    .eq("codigo", codigo)
    .eq("usado", false)
    .gt("expira_em", new Date().toISOString())
    .select("id")
    .limit(1);

  return !!(updated && updated.length > 0);
}
