import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  const { data } = await supabaseAdmin
    .from("associacoes")
    .select("id, nome")
    .eq("status", "ativo")
    .order("nome");

  return NextResponse.json({ associacoes: data ?? [] });
}
