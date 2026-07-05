import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { notificarNovoLead } from "@/lib/whatsapp";
import { z } from "zod";

const schema = z.object({
  nome_lead: z.string().min(2).max(100),
  telefone_lead: z.string().min(10).max(20),
  consultor_id: z.string().uuid().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!rateLimit(`indicar:${ip}`, 5, 60)) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde 1 minuto." }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisicao invalida" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });

  const { nome_lead, telefone_lead, consultor_id } = parsed.data;
  const tel = telefone_lead.replace(/\D/g, "");

  let cid = consultor_id ?? null;

  if (cid) {
    const { data: consultor } = await supabaseAdmin
      .from("consultores")
      .select("id, status")
      .eq("id", cid)
      .single();
    if (!consultor || consultor.status !== "ativo") cid = null;
  }

  if (!cid) {
    const { data: config } = await supabaseAdmin
      .from("configuracoes")
      .select("consultor_padrao_id")
      .limit(1)
      .single();
    cid = config?.consultor_padrao_id ?? null;
  }

  // Verifica duplicata por telefone
  if (cid) {
    const { data: existente } = await supabaseAdmin
      .from("indicacoes")
      .select("id")
      .eq("consultor_id", cid)
      .eq("telefone_lead", tel)
      .limit(1)
      .single();
    if (existente) return NextResponse.json({ error: "Este telefone ja foi indicado anteriormente." }, { status: 409 });
  }

  const { error } = await supabaseAdmin.from("indicacoes").insert({
    nome_lead,
    telefone_lead: tel,
    consultor_id: cid,
    status: "novo",
  });

  if (error) return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });

  // Notifica consultor em background
  if (cid) {
    supabaseAdmin
      .from("consultores")
      .select("nome, telefone")
      .eq("id", cid)
      .single()
      .then(({ data }) => {
        if (data) {
          notificarNovoLead({
            nomeConsultor: data.nome,
            telefoneConsultor: data.telefone,
            nomeLead: nome_lead,
            telefoneLead: tel,
          }).catch(() => {});
        }
      });
  }

  return NextResponse.json({ ok: true });
}
