import { NextRequest, NextResponse } from "next/server";
import { getAssociacaoLogada } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { z } from "zod";

const DEFAULTS = [
  { tipo: "moto", label: "Moto", icone: "moto", comissao_indicador: 50, ativo: true },
  { tipo: "carro", label: "Carro", icone: "carro", comissao_indicador: 100, ativo: true },
  { tipo: "caminhao", label: "Caminhao", icone: "caminhao", comissao_indicador: 500, ativo: true },
];

export async function GET() {
  const associacao = await getAssociacaoLogada();
  if (!associacao) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const { data } = await supabaseAdmin
    .from("comissoes_tipos")
    .select("tipo, label, icone, comissao_indicador, ativo")
    .eq("associacao_id", associacao.id)
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
  const associacao = await getAssociacaoLogada();
  if (!associacao) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisicao invalida" }, { status: 400 }); }

  const parsed = schemaPost.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });

  const { tipo, label, icone, comissao_indicador, ativo } = parsed.data;

  const { error } = await supabaseAdmin
    .from("comissoes_tipos")
    .upsert(
      { associacao_id: associacao.id, tipo, label, icone, comissao_indicador, ativo },
      { onConflict: "associacao_id,tipo" }
    );

  if (error) return NextResponse.json({ error: "Erro ao salvar comissao" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

const schemaDelete = z.object({
  tipo: z.string().min(1).max(50),
});

export async function DELETE(req: NextRequest) {
  const associacao = await getAssociacaoLogada();
  if (!associacao) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisicao invalida" }, { status: 400 }); }

  const parsed = schemaDelete.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("comissoes_tipos")
    .delete()
    .eq("associacao_id", associacao.id)
    .eq("tipo", parsed.data.tipo);

  if (error) return NextResponse.json({ error: "Erro ao excluir tipo" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
