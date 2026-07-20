export const dynamic = "force-dynamic";
import { getGestorLogado } from "@/lib/auth";
import { redirect } from "next/navigation";
import GestorCapturaClient from "./client";

export default async function GestorCapturaPage() {
  const gestor = await getGestorLogado();
  if (!gestor) redirect("/gestor/login");
  return <GestorCapturaClient gestorId={(gestor as { id: string }).id} nomeGestor={(gestor as { nome: string }).nome} />;
}
