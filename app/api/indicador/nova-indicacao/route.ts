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
  if (!indicador) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisição inválida" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { nome_lead, telefone_lead } = parsed.data;

  if (!indicador.consultor_id) return NextResponse.json({ error: "Indicador sem consultor vinculado" }, { status: 400 });

  const tel = telefone_lead.replace(/\D/g, "");

  // Verifica duplicata por telefone dentro da carteira do consultor
  const { data: existente } = await supabaseAdmin
    .from("indicacoes")
    .select("id")
    .eq("consultor_id", indicador.consultor_id)
    .eq("telefone_lead", tel)
    .limit(1)
    .single();

  if (existente) return NextResponse.json({ error: "Este telefone já foi indicado anteriormente." }, { status: 409 });

  const { error } = await supabaseAdmin.from("indicacoes").insert({
    nome_lead,
    telefone_lead: tel,
    consultor_id: indicador.consultor_id,
    indicador_id: indicador.id,
    status: "novo",
  });

  if (error) return NextResponse.json({ error: "Erro ao salvar indicação" }, { status: 500 });

  // Notificações em background
  supabaseAdmin
    .from("consultores")
    .select("nome, fone")
    .eq("id", indicador.consultor_id)
    .single()
    .then(({ data }) => {
      if (data) {
        notificarNovoLead({
          nomeConsultor: data.nome,
          telefoneConsultor: data.fone,
          nomeLead: nome_lead,
          telefoneLead: tel,
          viaIndicador: indicador.nome,
        }).catch(() => {});
      }
    });

  notificarNovaIndicacao({
    nomeIndicador: indicador.nome,
    telefoneIndicador: indicador.telefone,
    nomeLead: nome_lead,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
