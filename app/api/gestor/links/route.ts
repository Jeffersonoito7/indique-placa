import { NextResponse } from "next/server";
import { getGestorLogado } from "@/lib/auth";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "";

export async function GET() {
  const gestor = await getGestorLogado();
  if (!gestor) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  return NextResponse.json({
    gestorId: gestor.id,
    nome: gestor.nome,
    linkConsultor: `${BASE_URL}/captura/consultor/${gestor.id}`,
    linkIndicador: `${BASE_URL}/captura/indicador-gestor/${gestor.id}`,
    linkLead: `${BASE_URL}/captura/gestor/${gestor.id}`,
  });
}
