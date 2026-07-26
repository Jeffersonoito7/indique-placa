import { NextRequest, NextResponse } from "next/server";
import { getGestorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

// Vercel Pro/Enterprise: aumenta o timeout para 60s para suportar campanhas de ate 200 numeros
export const maxDuration = 60;

const BATCH_SIZE = 5;

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

  // Modo evolution: batches paralelos de BATCH_SIZE sem delay artificial
  // Delay no servidor causaria timeout serverless (limite 60-300s)
  const instanceName = `gestor-${gestor.id}`;
  const numerosLimpos = numeros.map((n) => String(n).replace(/\D/g, ""));
  const resultados: Array<"ok" | "erro"> = [];

  for (let i = 0; i < numerosLimpos.length; i += BATCH_SIZE) {
    const batch = numerosLimpos.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map((n) => enviarParaNumero(n, mensagem, instanceName))
    );
    resultados.push(...batchResults);
  }

  const enviados = resultados.filter((r) => r === "ok").length;
  const erros = numerosLimpos.filter((_, idx) => resultados[idx] === "erro");

  return NextResponse.json({ enviados, erros, links: [] });
}
