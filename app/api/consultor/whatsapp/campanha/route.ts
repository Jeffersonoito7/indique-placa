import { NextRequest, NextResponse } from "next/server";
import { getConsultorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  const consultor = await getConsultorLogado();
  if (!consultor) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const { numeros, mensagem, modo } = body as {
    numeros: string[];
    mensagem: string;
    modo: "evolution" | "manual";
  };

  if (!Array.isArray(numeros) || !mensagem || !modo) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  if (modo === "manual") {
    const links = numeros.map((n) => ({
      numero: n,
      link: `https://wa.me/55${n.replace(/\D/g, "")}?text=${encodeURIComponent(mensagem)}`,
    }));
    return NextResponse.json({ links, enviados: 0 });
  }

  const { data: config } = await supabaseAdmin
    .from("consultor_whatsapp_config")
    .select("intervalo_min, intervalo_max")
    .eq("consultor_id", consultor.id)
    .maybeSingle();

  const intervaloMin = (config?.intervalo_min ?? 30) * 1000;
  const intervaloMax = (config?.intervalo_max ?? 90) * 1000;

  const instanceName = `consultor-${consultor.id}`;
  let enviados = 0;
  const erros: string[] = [];

  for (const numero of numeros) {
    const numeroLimpo = numero.replace(/\D/g, "");
    try {
      const res = await fetch(
        `${process.env.EVOLUTION_API_URL}/message/sendText/${instanceName}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: process.env.EVOLUTION_API_KEY!,
          },
          body: JSON.stringify({ number: numeroLimpo, text: mensagem }),
        }
      );

      if (res.ok) {
        enviados++;
      } else {
        erros.push(numeroLimpo);
      }
    } catch {
      erros.push(numeroLimpo);
    }

    if (numero !== numeros[numeros.length - 1]) {
      const espera = Math.floor(Math.random() * (intervaloMax - intervaloMin + 1)) + intervaloMin;
      await delay(espera);
    }
  }

  return NextResponse.json({ enviados, erros, links: [] });
}
