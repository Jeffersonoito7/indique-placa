import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { verificarToken } from "@/lib/master-token";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("master_auth")?.value ?? "";
  if (!verificarToken(token)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const de = req.nextUrl.searchParams.get("de");
  const ate = req.nextUrl.searchParams.get("ate");

  // Busca indicacoes com filtro de data opcional
  let query = supabaseAdmin
    .from("indicacoes")
    .select("id, status, comissao_valor, criado_em, consultor_id");

  if (de) query = query.gte("criado_em", de + "T00:00:00");
  if (ate) query = query.lte("criado_em", ate + "T23:59:59");

  const { data: indicacoes, error: errInd } = await query;
  if (errInd) return NextResponse.json({ error: errInd.message }, { status: 500 });

  const { data: consultores, error: errCons } = await supabaseAdmin
    .from("consultores")
    .select("id, nome, fone, status");

  if (errCons) return NextResponse.json({ error: errCons.message }, { status: 500 });

  const todasInd = (indicacoes ?? []) as { id: string; status: string; comissao_valor: number | null; criado_em: string; consultor_id: string }[];

  const relatorio = (consultores ?? []).map((c) => {
    const todas = todasInd.filter((i) => i.consultor_id === c.id);
    const fechadas = todas.filter((i) => i.status === "fechado");
    const comissoes = fechadas.reduce((acc, i) => acc + (i.comissao_valor ?? 0), 0);
    const conversao = todas.length > 0 ? Math.round((fechadas.length / todas.length) * 100) : 0;
    return {
      id: c.id as string,
      nome: c.nome as string,
      fone: c.fone as string,
      ativo: (c.status as string) === "ativo",
      total_indicacoes: todas.length,
      total_fechadas: fechadas.length,
      taxa_conversao: conversao,
      total_comissoes: comissoes,
    };
  });

  relatorio.sort((a, b) => b.total_fechadas - a.total_fechadas);

  return NextResponse.json({ relatorio, de: de ?? null, ate: ate ?? null });
}
