import { NextRequest, NextResponse } from "next/server";
import { getConsultorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  const consultor = await getConsultorLogado();
  if (!consultor) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const { numeros, mensagem, modo } = (body ?? {}) as {
    numeros: unknown;
    mensagem: unknown;
    modo: unknown;
  };

  if (!Array.isArray(numeros) || typeof mensagem !== "string" || !mensagem.trim() ||
      (modo !== "evolution" && modo !== "manual")) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const MAX_NUMEROS = 200;
  if (numeros.length > MAX_NUMEROS) {
    return NextResponse.json(
      { error: `Limite de ${MAX_NUMEROS} números por campanha` },
      { status: 400 }
    );
  }

  if (mensagem.length > 1000) {
    return NextResponse.json({ error: "Mensagem muito longa (máximo 1000 caracteres)" }, { status: 400 });
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
