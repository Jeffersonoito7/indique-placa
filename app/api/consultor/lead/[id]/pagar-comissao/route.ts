import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";
import { validarSessao } from "@/lib/sessoes";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("consultor_auth")?.value;
  if (!token) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const consultorId = await validarSessao(token, "consultor");
  if (!consultorId) return NextResponse.json({ error: "Sessao expirada" }, { status: 401 });

  const { id } = await params;

  const { data: lead } = await supabaseAdmin
    .from("indicacoes")
    .select("id, consultor_id, indicador_id, comissao_valor, status")
    .eq("id", id)
    .single();

  if (!lead || lead.consultor_id !== consultorId) {
    return NextResponse.json({ error: "Lead nao encontrado" }, { status: 404 });
  }

  if (lead.status !== "fechado") {
    return NextResponse.json({ error: "So e possivel pagar comissao de leads fechados" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("indicacoes")
    .update({ comissao_paga: true, comissao_paga_em: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: "Erro ao registrar pagamento" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
