import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({
  gestor_id: z.string().uuid(),
  placa: z.string().min(3).max(10),
  nome_lead: z.string().min(2).max(100),
  telefone_lead: z.string().min(10).max(20),
  tipo_veiculo: z.enum(["moto", "carro", "caminhao"]),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const { allowed } = await rateLimit(`captura-gestor:${ip}`, 10, 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde 1 minuto." }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { gestor_id, placa, nome_lead, telefone_lead, tipo_veiculo } = parsed.data;

  const { data: gestor } = await supabaseAdmin
    .from("gestores")
    .select("id, ativo, associacao_id")
    .eq("id", gestor_id)
    .single();

  if (!gestor || !gestor.ativo) {
    return NextResponse.json({ error: "Gestor não encontrado ou inativo." }, { status: 404 });
  }

  const tel = telefone_lead.replace(/\D/g, "");

  const { error } = await supabaseAdmin.from("indicacoes").insert({
    gestor_id,
    consultor_id: null,
    placa,
    nome_lead,
    telefone_lead: tel,
    tipo_veiculo,
    status: "novo",
    associacao_id: gestor.associacao_id ?? null,
  });

  if (error) {
    return NextResponse.json({ error: "Erro ao salvar indicação." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
