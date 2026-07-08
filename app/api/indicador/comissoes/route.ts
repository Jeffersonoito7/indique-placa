import { NextResponse } from "next/server";
import { getIndicadorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  const indicador = await getIndicadorLogado();
  if (!indicador) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  const { data } = await supabaseAdmin
    .from("indicacoes")
    .select("id, placa, nome_lead, tipo_veiculo, criado_em, comissao_valor, comissao_paga, comissao_paga_em")
    .eq("indicador_id", indicador.id)
    .eq("status", "fechado")
    .order("criado_em", { ascending: false });

  const indicacoes = data ?? [];
  const total_ganho = indicacoes.reduce((acc, i) => acc + (i.comissao_valor ?? 0), 0);
  const total_pago = indicacoes
    .filter((i) => i.comissao_paga)
    .reduce((acc, i) => acc + (i.comissao_valor ?? 0), 0);
  const total_pendente = total_ganho - total_pago;

  return NextResponse.json({ indicacoes, total_ganho, total_pago, total_pendente });
}
