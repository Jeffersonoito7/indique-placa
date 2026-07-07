import { NextRequest, NextResponse } from "next/server";
import { getIndicadorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { notificarNovoLead, notificarNovaIndicacao } from "@/lib/whatsapp";
import { z } from "zod";

const schema = z.object({
  placa: z.string().min(7).max(7).regex(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/, "Placa inválida"),
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

  const { placa, nome_lead, telefone_lead } = parsed.data;

  if (!indicador.consultor_id) return NextResponse.json({ error: "Indicador sem consultor vinculado" }, { status: 400 });

  const tel = telefone_lead?.replace(/\D/g, "") ?? null;

  // Deduplicacao por placa dentro da carteira do consultor
  const { data: existente } = await supabaseAdmin
    .from("indicacoes")
    .select("id")
    .eq("consultor_id", indicador.consultor_id)
    .eq("placa", placa)
    .limit(1)
    .single();

  if (existente) return NextResponse.json({ error: "Esta placa já foi indicada anteriormente." }, { status: 409 });

  const { error } = await supabaseAdmin.from("indicacoes").insert({
    placa,
    nome_lead: nome_lead ?? null,
    telefone_lead: tel,
    consultor_id: indicador.consultor_id,
    indicador_id: indicador.id,
    status: "novo",
  });

  if (error) return NextResponse.json({ error: "Erro ao salvar indicação" }, { status: 500 });

  // Notificacoes em background
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
          placa,
          nomeLead: nome_lead ?? null,
          telefoneLead: tel,
          viaIndicador: indicador.nome,
        }).catch(() => {});
      }
    });

  notificarNovaIndicacao({
    nomeIndicador: indicador.nome,
    telefoneIndicador: indicador.telefone,
    placa,
    nomeLead: nome_lead ?? null,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
