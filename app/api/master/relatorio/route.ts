import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { verificarToken } from "@/lib/master-token";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("master_auth")?.value ?? "";
  if (!verificarToken(token)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { data: consultores, error } = await supabaseAdmin
    .from("consultores")
    .select(`
      id, nome, fone, ativo,
      indicacoes(id, status, comissao_valor, criado_em)
    `);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const relatorio = (consultores ?? []).map((c) => {
    const todas = (c.indicacoes as { id: string; status: string; comissao_valor: number | null; criado_em: string }[]) ?? [];
    const fechadas = todas.filter((i) => i.status === "fechado");
    const comissoes = fechadas.reduce((acc, i) => acc + (i.comissao_valor ?? 0), 0);
    const conversao = todas.length > 0 ? Math.round((fechadas.length / todas.length) * 100) : 0;
    return {
      id: c.id as string,
      nome: c.nome as string,
      fone: c.fone as string,
      ativo: c.ativo as boolean,
      total_indicacoes: todas.length,
      total_fechadas: fechadas.length,
      taxa_conversao: conversao,
      total_comissoes: comissoes,
    };
  });

  relatorio.sort((a, b) => b.total_fechadas - a.total_fechadas);

  return NextResponse.json({ relatorio });
}
