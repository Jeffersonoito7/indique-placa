import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getGestorLogado } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  consultor_origem_id: z.string().uuid(),
  consultor_destino_id: z.string().uuid(),
  motivo: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const gestor = await getGestorLogado();
  if (!gestor) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados invalidos" }, { status: 422 });

  const { consultor_origem_id, consultor_destino_id, motivo } = parsed.data;

  if (consultor_origem_id === consultor_destino_id) {
    return NextResponse.json({ error: "Origem e destino nao podem ser o mesmo consultor" }, { status: 400 });
  }

  // Garante que origem e destino pertencem a este gestor
  const { data: consultores } = await supabaseAdmin
    .from("consultores")
    .select("id, nome, status")
    .eq("gestor_id", gestor.id)
    .in("id", [consultor_origem_id, consultor_destino_id]);

  const origem = consultores?.find((c) => c.id === consultor_origem_id);
  const destino = consultores?.find((c) => c.id === consultor_destino_id);

  if (!origem) return NextResponse.json({ error: "Consultor de origem nao encontrado no seu time" }, { status: 404 });
  if (!destino) return NextResponse.json({ error: "Consultor de destino nao encontrado no seu time" }, { status: 404 });
  if (destino.status !== "ativo") return NextResponse.json({ error: "Consultor de destino esta inativo" }, { status: 400 });

  // Busca todos os leads abertos (nao fechados) do consultor de origem
  const { data: leads, error: errLeads } = await supabaseAdmin
    .from("indicacoes")
    .select("id, consultor_id, status")
    .eq("consultor_id", consultor_origem_id)
    .neq("status", "fechado");

  if (errLeads) return NextResponse.json({ error: "Erro ao buscar leads" }, { status: 500 });

  if (!leads || leads.length === 0) {
    return NextResponse.json({ ok: true, transferidos: 0, mensagem: "Nenhum lead em aberto para transferir" });
  }

  const ids = leads.map((l) => l.id);

  const { error: errUpdate } = await supabaseAdmin
    .from("indicacoes")
    .update({ consultor_id: consultor_destino_id })
    .in("id", ids);

  if (errUpdate) return NextResponse.json({ error: errUpdate.message }, { status: 500 });

  // Registra historico de transferencia (falha nao cancela a transferencia ja realizada)
  const registros = ids.map((id) => ({
    indicacao_id: id,
    consultor_origem_id,
    consultor_destino_id,
    motivo: motivo ?? null,
    transferido_por_tipo: "gestor",
  }));

  try {
    await supabaseAdmin.from("lead_transferencias").insert(registros);
  } catch (err) {
    console.error("[gestor/transferir] Falha ao registrar log de transferencia:", err);
  }

  return NextResponse.json({ ok: true, transferidos: leads.length });
}
