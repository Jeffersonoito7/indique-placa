import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data } = await supabaseAdmin
    .from("indicadores")
    .select("nome, status")
    .eq("id", id)
    .maybeSingle();

  if (!data || data.status !== "ativo") {
    return NextResponse.json({ error: "Link inválido" }, { status: 404 });
  }

  return NextResponse.json({ nome: data.nome });
}
