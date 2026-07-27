import { NextRequest, NextResponse } from "next/server";
import { getGestorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export const maxDuration = 300;

const EVOLUTION_MAX_NUMEROS = 20;
// Delay aleatorio entre MIN e MAX ms para simular comportamento humano
function delayAleatorio(minS: number, maxS: number): Promise<void> {
  const ms = Math.floor(Math.random() * (maxS - minS + 1) + minS) * 1000;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function enviarParaNumero(
  numeroLimpo: string,
  mensagem: string,
  instanceName: string
): Promise<"ok" | "erro"> {
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
    return res.ok ? "ok" : "erro";
  } catch {
    return "erro";
  }
}

export async function POST(request: NextRequest) {
  const gestor = await getGestorLogado();
  if (!gestor) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

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

  if (
    !Array.isArray(numeros) ||
    typeof mensagem !== "string" ||
    !mensagem.trim() ||
    (modo !== "evolution" && modo !== "manual")
  ) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const maxPermitido = modo === "evolution" ? EVOLUTION_MAX_NUMEROS : 200;
  if (numeros.length > maxPermitido) {
    return NextResponse.json(
      { error: modo === "evolution"
          ? `Modo Evolution suporta no maximo ${EVOLUTION_MAX_NUMEROS} numeros por vez para evitar bloqueio. Use o modo Manual para campanhas maiores.`
          : `Limite de 200 numeros por campanha` },
      { status: 400 }
    );
  }

  if (mensagem.length > 1000) {
    return NextResponse.json({ error: "Mensagem muito longa (máximo 1000 caracteres)" }, { status: 400 });
  }

  // Verificar se o plano permite campanha WhatsApp
  const { data: planoConfig } = await supabaseAdmin
    .from("planos_config_gestor")
    .select("campanha_whatsapp")
    .eq("plano", (gestor as { plano?: string }).plano ?? "free")
    .maybeSingle();

  if (!planoConfig?.campanha_whatsapp && modo === "evolution") {
    return NextResponse.json(
      { error: "Campanha WhatsApp não está disponível no seu plano. Faça upgrade Pro para usar este recurso." },
      { status: 403 }
    );
  }

  // Modo manual: gera links wa.me, sem Evolution API
  if (modo === "manual") {
    const links = numeros.map((n) => ({
      numero: n,
      link: `https://wa.me/55${String(n).replace(/\D/g, "")}?text=${encodeURIComponent(mensagem)}`,
    }));
    return NextResponse.json({ links, enviados: 0 });
  }

  // Busca config de intervalos do gestor
  const { data: wppConfig } = await supabaseAdmin
    .from("gestor_whatsapp_config")
    .select("intervalo_min, intervalo_max")
    .eq("gestor_id", gestor.id)
    .maybeSingle();

  // Intervalo em segundos configurado pelo gestor (min 3s, max 30s para caber no timeout)
  const intervaloMin = Math.max(3, Math.min(wppConfig?.intervalo_min ?? 5, 30));
  const intervaloMax = Math.max(intervaloMin, Math.min(wppConfig?.intervalo_max ?? 10, 30));

  const instanceName = `gestor-${gestor.id}`;
  const numerosLimpos = numeros.map((n) => String(n).replace(/\D/g, ""));
  const resultados: Array<"ok" | "erro"> = [];

  // Envio sequencial com delay aleatorio entre cada mensagem
  for (let i = 0; i < numerosLimpos.length; i++) {
    const resultado = await enviarParaNumero(numerosLimpos[i], mensagem, instanceName);
    resultados.push(resultado);
    // Aguarda intervalo aleatorio entre mensagens (exceto apos o ultimo)
    if (i < numerosLimpos.length - 1) {
      await delayAleatorio(intervaloMin, intervaloMax);
    }
  }

  const enviados = resultados.filter((r) => r === "ok").length;
  const erros = numerosLimpos.filter((_, idx) => resultados[idx] === "erro");

  return NextResponse.json({ enviados, erros, links: [] });
}
