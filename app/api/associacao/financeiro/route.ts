import { NextResponse } from "next/server";
import { getAssociacaoLogada } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  const assoc = await getAssociacaoLogada();
  if (!assoc) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const [consultoresRes, cobrancasRes] = await Promise.all([
    supabaseAdmin
      .from("consultores")
      .select("id, nome, fone, plano, plano_ativo_ate, status")
      .eq("associacao_id", assoc.id)
      .order("nome"),
    supabaseAdmin
      .from("cobrancas")
      .select("id, usuario_id, valor, status, pago_em, criado_em, txid")
      .eq("associacao_id", assoc.id)
      .order("criado_em", { ascending: false }),
  ]);

  const consultores = consultoresRes.data ?? [];
  const cobrancas = cobrancasRes.data ?? [];

  // Monta mapa de ultima cobranca por consultor
  const ultimaCobByConsultor: Record<string, (typeof cobrancas)[0]> = {};
  for (const c of cobrancas) {
    if (!ultimaCobByConsultor[c.usuario_id]) {
      ultimaCobByConsultor[c.usuario_id] = c;
    }
  }

  const consultoresComStatus = consultores.map((c) => {
    const ult = ultimaCobByConsultor[c.id] ?? null;
    const diasVencimento = c.plano_ativo_ate
      ? Math.ceil((new Date(c.plano_ativo_ate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;
    return {
      ...c,
      ultima_cobranca: ult,
      dias_vencimento: diasVencimento,
    };
  });

  const totalConsultores = consultores.length;
  const totalPro = consultores.filter((c) => c.plano === "pro").length;
  const totalInadimplentes = consultores.filter((c) => {
    if (c.plano !== "pro") return false;
    const ult = ultimaCobByConsultor[c.id];
    return !ult || ult.status !== "pago";
  }).length;
  const totalRecebido = cobrancas
    .filter((c) => c.status === "pago")
    .reduce((acc, c) => acc + Number(c.valor), 0);

  return NextResponse.json({
    consultores: consultoresComStatus,
    cobrancas,
    resumo: { totalConsultores, totalPro, totalInadimplentes, totalRecebido },
    valorMensalidade: Number(assoc.plano ?? 0),
  });
}
