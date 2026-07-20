import { NextResponse } from "next/server";
import { getConsultorLogado } from "@/lib/auth";

export async function POST() {
  const consultor = await getConsultorLogado();
  if (!consultor) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const instanceName = `consultor-${consultor.id}`;

  try {
    const res = await fetch(
      `${process.env.EVOLUTION_API_URL}/instance/delete/${instanceName}`,
      {
        method: "DELETE",
        headers: { apikey: process.env.EVOLUTION_API_KEY! },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: "Falha ao desconectar", detail: text }, { status: 502 });
    }

    return NextResponse.json({ sucesso: true });
  } catch {
    return NextResponse.json({ error: "Erro ao conectar com Evolution API" }, { status: 500 });
  }
}
