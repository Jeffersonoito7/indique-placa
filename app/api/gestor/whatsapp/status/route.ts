import { NextResponse } from "next/server";
import { getGestorLogado } from "@/lib/auth";

export async function GET() {
  const gestor = await getGestorLogado();
  if (!gestor) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const instanceName = `gestor-${gestor.id}`;

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
