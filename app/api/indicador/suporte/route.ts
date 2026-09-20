import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getIndicadorLogado } from "@/lib/auth";
import { z } from "zod";

const postSchema = z.object({
  assunto: z.string().min(3).max(200),
  mensagem: z.string().min(10).max(2000),
});

export async function GET() {
  const indicador = await getIndicadorLogado();
  if (!indicador) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("suporte_tickets")
    .select("id, assunto, mensagem, status, resposta, respondido_em, created_at")
    .eq("perfil_tipo", "indicador")
    .eq("perfil_id", indicador.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: "Erro ao buscar tickets" }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const indicador = await getIndicadorLogado();
  if (!indicador) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  // busca associacao_id via consultor vinculado
  let associacao_id: string | null = null;
  if (indicador.consultor_id) {
    const { data: c } = await supabaseAdmin
      .from("consultores")
      .select("associacao_id")
      .eq("id", indicador.consultor_id)
      .maybeSingle();
    associacao_id = c?.associacao_id ?? null;
  }

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisição inválida" }, { status: 400 }); }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { error } = await supabaseAdmin.from("suporte_tickets").insert({
    associacao_id,
    perfil_tipo: "indicador",
    perfil_id: indicador.id,
    perfil_nome: indicador.nome,
    assunto: parsed.data.assunto,
    mensagem: parsed.data.mensagem,
  });

  if (error) return NextResponse.json({ error: "Erro ao abrir ticket" }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
