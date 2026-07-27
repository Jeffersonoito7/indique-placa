import { NextResponse } from "next/server";
import { getGestorLogado } from "@/lib/auth";
import { createHmac } from "crypto";

export async function POST() {
  const gestor = await getGestorLogado();
  if (!gestor) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const instanceName = `gestor-${gestor.id}`;

  try {
    const res = await fetch(`${process.env.EVOLUTION_API_URL}/instance/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.EVOLUTION_API_KEY!,
      },
      // Token unico por instancia derivado de SESSION_SECRET — nunca usar a chave admin
      body: JSON.stringify({
        instanceName,
        token: createHmac("sha256", process.env.SESSION_SECRET ?? "default")
          .update(`wpp-gestor-${gestor.id}`)
          .digest("hex")
          .slice(0, 32),
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
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
