import { NextResponse } from "next/server";
import { getIndicadorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

const DEFAULTS = [
  { tipo: "moto",    label: "Moto",    comissao_indicador: 50  },
  { tipo: "carro",   label: "Carro",   comissao_indicador: 100 },
  { tipo: "caminhao",label: "Caminhão",comissao_indicador: 500 },
];

export async function GET() {
  const indicador = await getIndicadorLogado();
  if (!indicador) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { data } = await supabaseAdmin
    .from("comissoes_tipos")
    .select("tipo, label, comissao_indicador")
    .eq("consultor_id", indicador.consultor_id)
    .eq("ativo", true)
    .order("created_at", { ascending: true });

  if (!data || data.length === 0) return NextResponse.json(DEFAULTS);
  return NextResponse.json(data);
}
