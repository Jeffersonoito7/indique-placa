import { NextRequest, NextResponse } from "next/server";
import { getGestorLogado } from "@/lib/auth";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "";

export async function GET() {
  const gestor = await getGestorLogado();
  if (!gestor) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  return NextResponse.json({
    link: `${BASE_URL}/captura/gestor/${gestor.id}`,
    gestorId: gestor.id,
    nome: gestor.nome,
  });
}

export async function POST(req: NextRequest) {
  const gestor = await getGestorLogado();
  if (!gestor) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requisicao invalida" }, { status: 400 });
  }

  const { tipo } = body as { tipo?: string };

  if (tipo === "consultor") {
    return NextResponse.json({
      link: `${BASE_URL}/captura/consultor/${gestor.id}`,
      gestorId: gestor.id,
      nome: gestor.nome,
      tipo: "consultor",
    });
  }

  if (tipo === "cotacao") {
    return NextResponse.json({
      link: `${BASE_URL}/captura/gestor/${gestor.id}`,
      gestorId: gestor.id,
      nome: gestor.nome,
      tipo: "cotacao",
    });
  }

  return NextResponse.json({ error: "Tipo invalido. Use 'consultor' ou 'cotacao'" }, { status: 400 });
}
