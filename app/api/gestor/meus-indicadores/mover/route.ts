import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getGestorLogado } from "@/lib/auth";
import { z } from "zod";

const bodySchema = z.object({
  indicador_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const gestor = await getGestorLogado();
  if (!gestor) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requisicao invalida" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });

  const { indicador_id } = parsed.data;

  // 1. Busca o indicador
  const { data: indicador, error: errIndicador } = await supabaseAdmin
    .from("indicadores")
    .select("id, nome, telefone, consultor_id")
    .eq("id", indicador_id)
    .maybeSingle();

  if (errIndicador) {
    console.error("[gestor/meus-indicadores/mover] buscar indicador:", errIndicador.code, errIndicador.message);
    return NextResponse.json({ error: "Erro ao buscar indicador" }, { status: 500 });
  }

  if (!indicador) {
    return NextResponse.json({ error: "Indicador nao encontrado" }, { status: 404 });
  }

  // 2. Verifica que o indicador esta vinculado a um consultor
  if (!indicador.consultor_id) {
    return NextResponse.json({ error: "Indicador nao esta vinculado a nenhum consultor" }, { status: 422 });
  }

  // 3. Busca o consultor
  const { data: consultor, error: errConsultor } = await supabaseAdmin
    .from("consultores")
    .select("id, gestor_id")
    .eq("id", indicador.consultor_id)
    .maybeSingle();

  if (errConsultor) {
    console.error("[gestor/meus-indicadores/mover] buscar consultor:", errConsultor.code, errConsultor.message);
    return NextResponse.json({ error: "Erro ao buscar consultor" }, { status: 500 });
  }

  if (!consultor) {
    return NextResponse.json({ error: "Consultor nao encontrado" }, { status: 404 });
  }

  // 4. Verifica que o consultor pertence ao time do gestor
  if (consultor.gestor_id !== gestor.id) {
    return NextResponse.json({ error: "Consultor nao pertence ao seu time" }, { status: 403 });
  }

  // 5. Adota o indicador: transfere para o gestor e desvincula do consultor
  const { data: atualizado, error: errUpdate } = await supabaseAdmin
    .from("indicadores")
    .update({ gestor_id: gestor.id, consultor_id: null })
    .eq("id", indicador_id)
    .select("id, nome, telefone")
    .single();

  if (errUpdate) {
    console.error("[gestor/meus-indicadores/mover] update:", errUpdate.code, errUpdate.message);
    return NextResponse.json({ error: "Erro ao mover indicador" }, { status: 500 });
  }

  // 6. Retorna confirmacao
  return NextResponse.json({ ok: true, indicador: atualizado });
}
