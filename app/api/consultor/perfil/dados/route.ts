import { NextResponse } from "next/server";
import { getConsultorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  const consultor = await getConsultorLogado();
  if (!consultor) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const { data } = await supabaseAdmin
    .from("consultores")
    .select("id, nome, sobrenome, fone, email, foto_url")
    .eq("id", consultor.id)
    .single();

  if (!data) return NextResponse.json({ error: "Consultor nao encontrado" }, { status: 404 });

  return NextResponse.json(data);
}
