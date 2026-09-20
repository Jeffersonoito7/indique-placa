import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";

const DEFAULTS = [
  { tipo: "moto",    label: "Moto",    comissao_indicador: 50  },
  { tipo: "carro",  label: "Carro",   comissao_indicador: 100 },
  { tipo: "caminhao", label: "Caminhão", comissao_indicador: 500 },
];

export async function GET(req: NextRequest) {
  const { allowed } = await rateLimit(getRateLimitKey(req, "tipos-veiculo"), 20, 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Muitas tentativas." }, { status: 429 });

  let consultor_id = req.nextUrl.searchParams.get("consultor_id");
  const indicador_id = req.nextUrl.searchParams.get("indicador_id");

  // Se veio indicador_id, resolve o consultor_id a partir do indicador
  if (!consultor_id && indicador_id) {
    const { data: indic } = await supabaseAdmin
      .from("indicadores")
      .select("consultor_id")
      .eq("id", indicador_id)
      .maybeSingle();
    consultor_id = indic?.consultor_id ?? null;
  }

  if (!consultor_id) return NextResponse.json(DEFAULTS);

  const { data } = await supabaseAdmin
    .from("comissoes_tipos")
    .select("tipo, label, comissao_indicador")
    .eq("consultor_id", consultor_id)
    .eq("ativo", true)
    .order("tipo", { ascending: true });

  if (!data || data.length === 0) return NextResponse.json(DEFAULTS);
  return NextResponse.json(data);
}
