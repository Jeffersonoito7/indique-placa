import { NextResponse } from "next/server";
import { getConsultorLogado } from "@/lib/auth";
import { createHmac } from "crypto";

function exigirSessionSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET ausente");
  return s;
}

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
      // Token unico por instancia derivado de SESSION_SECRET — nunca usar a chave admin
      body: JSON.stringify({
        instanceName,
        token: createHmac("sha256", exigirSessionSecret())
          .update(`wpp-${consultor.id}`)
          .digest("hex")
          .slice(0, 32),
        qrcode: true,
      }),
    });

    let base64: string | null = null;

    if (!res.ok) {
      // Instância já existe — busca o QR diretamente
      const connectRes = await fetch(
        `${process.env.EVOLUTION_API_URL}/instance/connect/${instanceName}`,
        { headers: { apikey: process.env.EVOLUTION_API_KEY! } }
      );
      if (!connectRes.ok) {
        const text = await connectRes.text();
        return NextResponse.json({ error: "Falha ao obter QR Code", detail: text }, { status: 502 });
      }
      const connectData = await connectRes.json();
      base64 = connectData?.base64 ?? null;
    } else {
      const data = await res.json();
      base64 = data?.qrcode?.base64 ?? null;
    }

    if (!base64) {
      return NextResponse.json({ error: "QR code não retornado pela Evolution API" }, { status: 502 });
    }

    return NextResponse.json({ qrcode: base64 });
  } catch (err) {
    return NextResponse.json({ error: "Erro ao conectar com Evolution API" }, { status: 500 });
  }
}
