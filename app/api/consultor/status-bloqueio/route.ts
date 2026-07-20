import { NextResponse } from "next/server";
import { getConsultorLogado } from "@/lib/auth";
import { verificarBloqueioConsultor } from "@/lib/consultor-status";

export async function GET() {
  const consultor = await getConsultorLogado();
  if (!consultor) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const status = await verificarBloqueioConsultor(consultor.id);
  return NextResponse.json(status);
}
