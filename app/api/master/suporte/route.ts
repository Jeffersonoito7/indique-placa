import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { verificarToken } from "@/lib/master-token";
import { z } from "zod";

function auth(req: NextRequest) {
  return verificarToken(req.cookies.get("master_auth")?.value ?? "");
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const url = req.nextUrl;
  const status = url.searchParams.get("status");

  let query = supabaseAdmin
    .from("suporte_tickets")
    .select("id, associacao_id, perfil_tipo, perfil_nome, assunto, mensagem, status, resposta, respondido_em, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (status && status !== "todos") query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Erro ao buscar tickets" }, { status: 500 });
  return NextResponse.json(data ?? []);
}

const patchSchema = z.object({
  id: z.string().uuid(),
  resposta: z.string().min(1).max(2000).optional(),
  status: z.enum(["aberto", "respondido", "fechado"]).optional(),
});

export async function PATCH(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisição inválida" }, { status: 400 }); }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { id, resposta, status } = parsed.data;

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (resposta !== undefined) {
    update.resposta = resposta;
    update.status = "respondido";
    update.respondido_em = new Date().toISOString();
  }
  if (status !== undefined) update.status = status;

  const { error } = await supabaseAdmin
    .from("suporte_tickets")
    .update(update)
    .eq("id", id);

  if (error) return NextResponse.json({ error: "Erro ao atualizar ticket" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
