import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
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

  // Se consultor_id informado, verificar se existe e esta ativo
  if (cid) {
    const { data: consultor } = await supabaseAdmin
      .from("consultores")
      .select("id, status")
      .eq("id", cid)
      .single();
    if (!consultor || consultor.status !== "ativo") cid = null;
  }

  // Fallback: consultor padrao configurado
  if (!cid) {
    const { data: config } = await supabaseAdmin
      .from("configuracoes")
      .select("consultor_padrao_id")
      .limit(1)
      .single();
    cid = config?.consultor_padrao_id ?? null;
  }

  const { error } = await supabaseAdmin.from("indicacoes").insert({
    nome_lead,
    telefone_lead: tel,
    consultor_id: cid,
    status: "novo",
  });

  if (error) return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
