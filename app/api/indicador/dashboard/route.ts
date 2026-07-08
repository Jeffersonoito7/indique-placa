import { NextResponse } from "next/server";
import { getIndicadorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  const indicador = await getIndicadorLogado();
  if (!indicador) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const [
    { data: leads, count },
    { count: countFechados },
    metasResult,
    { data: indicacoesFechadas },
  ] = await Promise.all([
    supabaseAdmin
      .from("indicacoes")
      .select("id, placa, nome_lead, status, criado_em", { count: "exact" })
      .eq("indicador_id", indicador.id)
      .order("criado_em", { ascending: false })
      .limit(6),
    supabaseAdmin
      .from("indicacoes")
      .select("id", { count: "exact", head: true })
      .eq("indicador_id", indicador.id)
      .eq("status", "fechado"),
    indicador.consultor_id
      ? supabaseAdmin
          .from("metas")
          .select("id, nome, tipo_veiculo, quantidade_indicacoes, bonus_valor")
          .eq("consultor_id", indicador.consultor_id)
          .eq("ativo", true)
      : Promise.resolve({ data: [] as any[] }),
    supabaseAdmin
      .from("indicacoes")
      .select("tipo_veiculo")
      .eq("indicador_id", indicador.id)
      .eq("status", "fechado"),
  ]);

  const total = count ?? 0;
  const fechados = countFechados ?? 0;

  const totalFechados = indicacoesFechadas?.length ?? 0;
  const fechadosPorTipo: Record<string, number> = {};
  for (const ind of indicacoesFechadas ?? []) {
    const t = (ind as any).tipo_veiculo ?? "carro";
    fechadosPorTipo[t] = (fechadosPorTipo[t] ?? 0) + 1;
  }

  const metas = ((metasResult as any).data ?? []).map((m: any) => {
    const progresso =
      m.tipo_veiculo === "todos"
        ? totalFechados
        : (fechadosPorTipo[m.tipo_veiculo] ?? 0);
    return { ...m, progresso };
  });

  return NextResponse.json({
    indicador: { id: indicador.id, nome: indicador.nome, chave_pix: (indicador as any).chave_pix ?? null },
    total,
    fechados,
    leads: leads ?? [],
    metas,
  });
}
