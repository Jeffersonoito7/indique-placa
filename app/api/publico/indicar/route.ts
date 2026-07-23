import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { notificarNovoLead } from "@/lib/whatsapp";
import { z } from "zod";

const schema = z.object({
  placa: z.string().min(7).max(7).regex(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/, "Placa inválida"),
  nome_lead: z.string().min(2).max(100),
  telefone_lead: z.string().min(10).max(20),
  consultor_id: z.string().uuid().optional().nullable(),
  tipo_veiculo: z.enum(["moto", "carro", "caminhao"]).default("carro"),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const { allowed: rlAllowed } = await rateLimit(`indicar:${ip}`, 5, 60 * 1000);
  if (!rlAllowed) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde 1 minuto." }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisição inválida" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { placa, nome_lead, telefone_lead, consultor_id, tipo_veiculo } = parsed.data;
  const tel = telefone_lead?.replace(/\D/g, "") ?? null;

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
    cid = (config as any)?.consultor_padrao_id ?? null;
  }

  // Deduplicacao por placa
  if (cid) {
    const { data: existente } = await supabaseAdmin
      .from("indicacoes")
      .select("id")
      .eq("consultor_id", cid)
      .eq("placa", placa)
      .limit(1)
      .single();
    if (existente) return NextResponse.json({ error: "Esta placa já foi indicada anteriormente." }, { status: 409 });
  }

  const { error } = await supabaseAdmin.from("indicacoes").insert({
    placa,
    nome_lead: nome_lead ?? null,
    telefone_lead: tel,
    consultor_id: cid,
    tipo_veiculo: tipo_veiculo ?? "carro",
    status: "novo",
  });

  if (error) return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });

  if (cid) {
    supabaseAdmin
      .from("consultores")
      .select("nome, fone")
      .eq("id", cid)
      .single()
      .then(({ data }) => {
        if (data) {
          notificarNovoLead({
            nomeConsultor: data.nome,
            telefoneConsultor: data.fone,
            placa,
            nomeLead: nome_lead ?? null,
            telefoneLead: tel,
          }).catch(() => {});
        }
      });
  }

  return NextResponse.json({ ok: true });
}
