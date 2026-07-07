import { NextRequest, NextResponse } from "next/server";
import { getConsultorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { z } from "zod";

const DEFAULTS = [
  { tipo: "moto", label: "Moto", icone: "moto", comissao_indicador: 50, ativo: true },
  { tipo: "carro", label: "Carro", icone: "carro", comissao_indicador: 100, ativo: true },
  { tipo: "caminhao", label: "Caminhão", icone: "caminhao", comissao_indicador: 500, ativo: true },
];

export async function GET() {
  const consultor = await getConsultorLogado();
  if (!consultor) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { data } = await supabaseAdmin
    .from("comissoes_tipos")
    .select("tipo, label, icone, comissao_indicador, ativo")
    .eq("consultor_id", consultor.id)
    .order("created_at", { ascending: true });

  if (!data || data.length === 0) return NextResponse.json(DEFAULTS);
  return NextResponse.json(data);
}

const schemaPost = z.object({
  tipo: z.string().min(1).max(50),
  label: z.string().min(1).max(50),
  icone: z.string().min(1).max(50).optional().default("custom"),
  comissao_indicador: z.number().min(0),
  ativo: z.boolean().optional().default(true),
});

export async function POST(req: NextRequest) {
  const consultor = await getConsultorLogado();
  if (!consultor) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisição inválida" }, { status: 400 }); }

  const parsed = schemaPost.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { tipo, label, icone, comissao_indicador, ativo } = parsed.data;

  const { error } = await supabaseAdmin
    .from("comissoes_tipos")
    .upsert(
      { consultor_id: consultor.id, tipo, label, icone, comissao_indicador, ativo },
      { onConflict: "consultor_id,tipo" }
    );

  if (error) return NextResponse.json({ error: "Erro ao salvar comissão" }, { status: 500 });

  return NextResponse.json({ ok: true });
}

const schemaDelete = z.object({
  tipo: z.string().min(1).max(50),
});

export async function DELETE(req: NextRequest) {
  const consultor = await getConsultorLogado();
  if (!consultor) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisição inválida" }, { status: 400 }); }

  const parsed = schemaDelete.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("comissoes_tipos")
    .delete()
    .eq("consultor_id", consultor.id)
    .eq("tipo", parsed.data.tipo);

  if (error) return NextResponse.json({ error: "Erro ao excluir tipo" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
