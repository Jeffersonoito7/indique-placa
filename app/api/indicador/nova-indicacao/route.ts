import { NextRequest, NextResponse } from "next/server";
import { getIndicadorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { notificarNovoLead, notificarNovaIndicacao } from "@/lib/whatsapp";
import { z } from "zod";

const schema = z.object({
  nome_lead: z.string().min(2).max(100),
  telefone_lead: z.string().min(10).max(20),
});

export async function POST(req: NextRequest) {
  const indicador = await getIndicadorLogado();
  if (!indicador) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisicao invalida" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });

  const { nome_lead, telefone_lead } = parsed.data;

  if (!indicador.consultor_id) return NextResponse.json({ error: "Indicador sem consultor vinculado" }, { status: 400 });

  const tel = telefone_lead.replace(/\D/g, "");

  const { error } = await supabaseAdmin.from("indicacoes").insert({
    nome_lead,
    telefone_lead: tel,
    consultor_id: indicador.consultor_id,
    indicador_id: indicador.id,
    status: "novo",
  });

  if (error) return NextResponse.json({ error: "Erro ao salvar indicacao" }, { status: 500 });

  // Notificacoes WhatsApp em background (nao bloqueia resposta)
  const { data: consultor } = await supabaseAdmin
    .from("consultores")
    .select("nome, telefone")
    .eq("id", indicador.consultor_id)
    .single();

  if (consultor) {
    notificarNovoLead({
      nomeConsultor: consultor.nome,
      telefoneConsultor: consultor.telefone,
      nomeLead: nome_lead,
      telefoneLead: tel,
      viaIndicador: indicador.nome,
    }).catch(() => {});
  }

  notificarNovaIndicacao({
    nomeIndicador: indicador.nome,
    telefoneIndicador: indicador.telefone,
    nomeLead: nome_lead,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
