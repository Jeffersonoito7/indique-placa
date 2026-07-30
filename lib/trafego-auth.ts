import "server-only";
import { cookies } from "next/headers";
import { verificarToken } from "@/lib/master-token";
import { getAssociacaoLogada, getGestorLogado } from "@/lib/auth";
import { validarSessao } from "@/lib/sessoes";

export type TipoUsuarioTrafego = "gestor" | "consultor" | "associacao" | "master";

export async function autenticarTrafego(tipo: TipoUsuarioTrafego): Promise<string | null> {
  const cookieStore = await cookies();
  if (tipo === "gestor") {
    const token = cookieStore.get("gestor_auth")?.value ?? "";
    return validarSessao(token, "gestor");
  }
  if (tipo === "consultor") {
    const token = cookieStore.get("consultor_auth")?.value ?? "";
    return validarSessao(token, "consultor");
  }
  if (tipo === "associacao") {
    const assoc = await getAssociacaoLogada();
    return assoc?.id ?? null;
  }
  if (tipo === "master") {
    const token = cookieStore.get("master_auth")?.value ?? "";
    return verificarToken(token) ? "master" : null;
  }
  return null;
}

export async function autenticarMaster(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("master_auth")?.value ?? "";
  return verificarToken(token);
}
