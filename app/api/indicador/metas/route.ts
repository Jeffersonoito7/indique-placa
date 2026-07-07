import { NextResponse } from "next/server";
import { getIndicadorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  const indicador = await getIndicadorLogado();
  if (!indicador) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  if (!indicador.consultor_id) return NextResponse.json([]);

  const [{ data: metas }, { data: indicacoes }] = await Promise.all([
    supabaseAdmin
      .from("metas")
      .select("id, nome, descricao, tipo_veiculo, quantidade_indicacoes, bonus_valor")
      .eq("consultor_id", indicador.consultor_id)
      .eq("ativo", true)
      .order("criado_em", { ascending: false }),
    supabaseAdmin
      .from("indicacoes")
      .select("tipo_veiculo, status")
      .eq("indicador_id", indicador.id)
      .eq("status", "fechado"),
  ]);

  const totalFechados = indicacoes?.length ?? 0;
  const fechadosPorTipo: Record<string, number> = {};
  for (const ind of indicacoes ?? []) {
    const t = ind.tipo_veiculo ?? "carro";
    fechadosPorTipo[t] = (fechadosPorTipo[t] ?? 0) + 1;
  }

  const resultado = (metas ?? []).map((m) => {
    const progresso =
      m.tipo_veiculo === "todos"
        ? totalFechados
        : (fechadosPorTipo[m.tipo_veiculo] ?? 0);
    return { ...m, progresso };
  });

  return NextResponse.json(resultado);
}
