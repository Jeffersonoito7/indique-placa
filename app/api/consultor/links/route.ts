import { NextResponse } from "next/server";
import { getConsultorLogado } from "@/lib/auth";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "";

export async function GET() {
  const consultor = await getConsultorLogado();
  if (!consultor) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  return NextResponse.json({
    consultorId: consultor.id,
    nome: consultor.nome,
    linkIndicador: `${BASE_URL}/captura/indicador/${consultor.id}`,
  });
}
