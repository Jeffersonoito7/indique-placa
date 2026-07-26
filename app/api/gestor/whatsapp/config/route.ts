import { NextRequest, NextResponse } from "next/server";
import { getGestorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  const gestor = await getGestorLogado();
  if (!gestor) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("gestor_whatsapp_config")
    .select("*")
    .eq("gestor_id", gestor.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Erro ao buscar config" }, { status: 500 });

  if (data) return NextResponse.json(data);

  const { data: criado, error: errCriado } = await supabaseAdmin
    .from("gestor_whatsapp_config")
    .insert({ gestor_id: gestor.id })
    .select()
    .single();

  if (errCriado) return NextResponse.json({ error: "Erro ao criar config" }, { status: 500 });

  return NextResponse.json(criado);
}

export async function POST(request: NextRequest) {
  const gestor = await getGestorLogado();
  if (!gestor) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const campos: Record<string, unknown> = {};
  const permitidos = [
    "mensagem_prospecto",
    "mensagem_indicacao",
    "horarios",
    "limite_diario",
    "intervalo_min",
    "intervalo_max",
    "modo_envio",
    "ativo_prospecto",
  ];

  for (const campo of permitidos) {
    if (campo in body) campos[campo] = body[campo];
  }

  campos.atualizado_em = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("gestor_whatsapp_config")
    .update(campos)
    .eq("gestor_id", gestor.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Erro ao salvar config" }, { status: 500 });

  return NextResponse.json(data);
}
