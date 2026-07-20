import { NextResponse } from "next/server";
import { getConsultorLogado } from "@/lib/auth";

export async function POST() {
  const consultor = await getConsultorLogado();
  if (!consultor) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const instanceName = `consultor-${consultor.id}`;

  try {
    const res = await fetch(`${process.env.EVOLUTION_API_URL}/instance/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.EVOLUTION_API_KEY!,
      },
      body: JSON.stringify({
        instanceName,
        token: process.env.EVOLUTION_API_KEY,
        qrcode: true,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: "Falha ao criar instancia", detail: text }, { status: 502 });
    }

    const data = await res.json();
    const base64 = data?.qrcode?.base64 ?? null;

    if (!base64) {
      return NextResponse.json({ error: "QR code não retornado pela Evolution API" }, { status: 502 });
    }

    return NextResponse.json({ qrcode: base64 });
  } catch (err) {
    return NextResponse.json({ error: "Erro ao conectar com Evolution API" }, { status: 500 });
  }
}
