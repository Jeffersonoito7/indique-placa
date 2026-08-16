import { NextResponse } from "next/server";
import { getAssociacaoLogada } from "@/lib/auth";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "";

export async function GET() {
  const assoc = await getAssociacaoLogada();
  if (!assoc) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  return NextResponse.json({
    assocId: assoc.id,
    nome: assoc.nome,
    linkGestor: `${BASE_URL}/captura/gestor-assoc/${assoc.id}`,
    linkConsultor: `${BASE_URL}/captura/consultor-assoc/${assoc.id}`,
    linkIndicador: `${BASE_URL}/captura/indicador-assoc/${assoc.id}`,
  });
}
