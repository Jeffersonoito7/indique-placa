import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getAssociacaoLogada } from "@/lib/auth";
import { z } from "zod";

const postSchema = z.object({
  assunto: z.string().min(3).max(200),
  mensagem: z.string().min(10).max(2000),
});

export async function GET() {
  const assoc = await getAssociacaoLogada();
  if (!assoc) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("suporte_tickets")
    .select("id, assunto, mensagem, status, resposta, respondido_em, created_at")
    .eq("perfil_tipo", "associacao")
    .eq("perfil_id", assoc.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: "Erro ao buscar tickets" }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const assoc = await getAssociacaoLogada();
  if (!assoc) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisição inválida" }, { status: 400 }); }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { error } = await supabaseAdmin.from("suporte_tickets").insert({
    associacao_id: assoc.id,
    perfil_tipo: "associacao",
    perfil_id: assoc.id,
    perfil_nome: assoc.nome,
    assunto: parsed.data.assunto,
    mensagem: parsed.data.mensagem,
  });

  if (error) return NextResponse.json({ error: "Erro ao abrir ticket" }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
