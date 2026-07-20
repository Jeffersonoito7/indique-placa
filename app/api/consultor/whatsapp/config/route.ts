import { NextRequest, NextResponse } from "next/server";
import { getConsultorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  const consultor = await getConsultorLogado();
  if (!consultor) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("consultor_whatsapp_config")
    .select("*")
    .eq("consultor_id", consultor.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Erro ao buscar config" }, { status: 500 });

  if (data) return NextResponse.json(data);

  const { data: criado, error: errCriado } = await supabaseAdmin
    .from("consultor_whatsapp_config")
    .insert({ consultor_id: consultor.id })
    .select()
    .single();

  if (errCriado) return NextResponse.json({ error: "Erro ao criar config" }, { status: 500 });

  return NextResponse.json(criado);
}

export async function POST(request: NextRequest) {
  const consultor = await getConsultorLogado();
  if (!consultor) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();

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
    .from("consultor_whatsapp_config")
    .update(campos)
    .eq("consultor_id", consultor.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Erro ao salvar config" }, { status: 500 });

  return NextResponse.json(data);
}
