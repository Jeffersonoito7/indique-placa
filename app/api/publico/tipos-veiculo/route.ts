import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

const DEFAULTS = [
  { tipo: "moto", label: "Moto" },
  { tipo: "carro", label: "Carro" },
  { tipo: "caminhao", label: "Caminhão" },
];

export async function GET(req: NextRequest) {
  const consultor_id = req.nextUrl.searchParams.get("consultor_id");
  if (!consultor_id) return NextResponse.json(DEFAULTS);

  const { data } = await supabaseAdmin
    .from("comissoes_tipos")
    .select("tipo, label")
    .eq("consultor_id", consultor_id)
    .eq("ativo", true)
    .order("created_at", { ascending: true });

  if (!data || data.length === 0) return NextResponse.json(DEFAULTS);
  return NextResponse.json(data);
}
