import { NextResponse } from "next/server";
import { getConsultorLogado } from "@/lib/auth";

export async function GET() {
  const consultor = await getConsultorLogado();
  if (!consultor) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const instanceName = `consultor-${consultor.id}`;

  try {
    const res = await fetch(
      `${process.env.EVOLUTION_API_URL}/instance/connectionState/${instanceName}`,
      {
        headers: { apikey: process.env.EVOLUTION_API_KEY! },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ conectado: false });
    }

    const data = await res.json();
    const state = data?.instance?.state ?? data?.state ?? "";

    return NextResponse.json({ conectado: state === "open" });
  } catch {
    return NextResponse.json({ conectado: false });
  }
}
