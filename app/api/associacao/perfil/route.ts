import { NextResponse } from "next/server";
import { getAssociacaoLogada } from "@/lib/auth";

export async function GET() {
  const assoc = await getAssociacaoLogada();
  if (!assoc) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  return NextResponse.json({ associacao: assoc });
}
