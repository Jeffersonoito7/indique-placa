import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getAssociacaoLogada } from "@/lib/auth";
import { z } from "zod";

const schema = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("consultor"),
    membro_id: z.string().uuid(),
    novo_gestor_id: z.string().uuid(),
  }),
  z.object({
    tipo: z.literal("indicador"),
    membro_id: z.string().uuid(),
    novo_consultor_id: z.string().uuid(),
  }),
]);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const assoc = await getAssociacaoLogada();
  if (!assoc) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id: gestorId } = await params;

  // Confirma gestor pertence à associação
  const { data: gestor } = await supabaseAdmin
    .from("gestores")
    .select("id")
    .eq("id", gestorId)
    .eq("associacao_id", assoc.id)
    .maybeSingle();
  if (!gestor) return NextResponse.json({ error: "Gestor não encontrado" }, { status: 404 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisição inválida" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  if (parsed.data.tipo === "consultor") {
    const { membro_id, novo_gestor_id } = parsed.data;

    // Confirma destino pertence à mesma associação
    const { data: destino } = await supabaseAdmin
      .from("gestores")
      .select("id")
      .eq("id", novo_gestor_id)
      .eq("associacao_id", assoc.id)
      .maybeSingle();
    if (!destino) return NextResponse.json({ error: "Gestor destino não encontrado" }, { status: 404 });

    // Confirma consultor está sob o gestor de origem
    const { data: consultor } = await supabaseAdmin
      .from("consultores")
      .select("id")
      .eq("id", membro_id)
      .eq("gestor_id", gestorId)
      .eq("associacao_id", assoc.id)
      .maybeSingle();
    if (!consultor) return NextResponse.json({ error: "Consultor não encontrado neste gestor" }, { status: 404 });

    const { error } = await supabaseAdmin
      .from("consultores")
      .update({ gestor_id: novo_gestor_id })
      .eq("id", membro_id);
    if (error) return NextResponse.json({ error: "Erro ao mover consultor" }, { status: 500 });

    return NextResponse.json({ ok: true });
  }

  // tipo === "indicador"
  const { membro_id, novo_consultor_id } = parsed.data;

  // Confirma consultor destino pertence à mesma associação
  const { data: consultorDestino } = await supabaseAdmin
    .from("consultores")
    .select("id, gestor_id")
    .eq("id", novo_consultor_id)
    .eq("associacao_id", assoc.id)
    .maybeSingle();
  if (!consultorDestino) return NextResponse.json({ error: "Consultor destino não encontrado" }, { status: 404 });

  // Confirma indicador está sob o gestor de origem
  const { data: indicador } = await supabaseAdmin
    .from("indicadores")
    .select("id")
    .eq("id", membro_id)
    .eq("gestor_id", gestorId)
    .eq("associacao_id", assoc.id)
    .maybeSingle();
  if (!indicador) return NextResponse.json({ error: "Indicador não encontrado neste gestor" }, { status: 404 });

  // Mover indicador e todos os seus leads
  const [errInd, errLeads] = await Promise.all([
    supabaseAdmin
      .from("indicadores")
      .update({
        consultor_id: novo_consultor_id,
        gestor_id: consultorDestino.gestor_id ?? gestorId,
      })
      .eq("id", membro_id)
      .then((r) => r.error),
    supabaseAdmin
      .from("indicacoes")
      .update({ consultor_id: novo_consultor_id })
      .eq("indicador_id", membro_id)
      .then((r) => r.error),
  ]);

  if (errInd || errLeads) return NextResponse.json({ error: "Erro ao mover indicador" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
