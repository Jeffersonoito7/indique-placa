import { NextRequest, NextResponse } from "next/server";
import { getConsultorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { z } from "zod";

export async function GET() {
  const consultor = await getConsultorLogado();
  if (!consultor) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const { data } = await supabaseAdmin
    .from("metas")
    .select("id, nome, descricao, tipo_veiculo, quantidade_indicacoes, bonus_valor, criado_em")
    .eq("consultor_id", consultor.id)
    .eq("ativo", true)
    .order("criado_em", { ascending: false });

  return NextResponse.json(data ?? []);
}

const schemaPost = z.object({
  nome: z.string().min(2).max(100),
  descricao: z.string().max(500).optional().nullable(),
  tipo_veiculo: z.enum(["todos", "moto", "carro", "caminhao"]).optional().default("todos"),
  quantidade_indicacoes: z.number().int().min(1),
  bonus_valor: z.number().min(0.01),
});

export async function POST(req: NextRequest) {
  const consultor = await getConsultorLogado();
  if (!consultor) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisicao invalida" }, { status: 400 }); }

  const parsed = schemaPost.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });

  const { nome, descricao, tipo_veiculo, quantidade_indicacoes, bonus_valor } = parsed.data;

  const { error } = await supabaseAdmin.from("metas").insert({
    consultor_id: consultor.id,
    nome,
    descricao: descricao ?? null,
    tipo_veiculo: tipo_veiculo ?? "todos",
    quantidade_indicacoes,
    bonus_valor,
    ativo: true,
  });

  if (error) return NextResponse.json({ error: "Erro ao criar meta" }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const consultor = await getConsultorLogado();
  if (!consultor) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID nao informado" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("metas")
    .update({ ativo: false })
    .eq("id", id)
    .eq("consultor_id", consultor.id);

  if (error) return NextResponse.json({ error: "Erro ao desativar meta" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
