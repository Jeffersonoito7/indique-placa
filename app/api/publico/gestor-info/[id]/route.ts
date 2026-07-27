import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const { data } = await supabaseAdmin
    .from("gestores")
    .select("id, nome, ativo")
    .eq("id", id)
    .eq("ativo", true)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ error: "Gestor não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ nome: data.nome });
}
