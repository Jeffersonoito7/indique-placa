import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";
import { validarSessao } from "@/lib/sessoes";
import { notificarLeadFechado } from "@/lib/whatsapp";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["novo", "contato", "fechado", "perdido"]),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("consultor_auth")?.value;
  if (!token) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const consultorId = await validarSessao(token, "consultor");
  if (!consultorId) return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });

  const { id } = await params;

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Dados inválidos" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Status inválido" }, { status: 400 });

  // Só pode alterar leads que pertencem a ele
  const { data: lead } = await supabaseAdmin
    .from("indicacoes")
    .select("id, consultor_id, nome_lead")
    .eq("id", id)
    .single();

  if (!lead || lead.consultor_id !== consultorId) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
  }

  const { error } = await supabaseAdmin
    .from("indicacoes")
    .update({ status: parsed.data.status })
    .eq("id", id);

  if (error) return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });

  // Notifica consultor quando lead é fechado
  if (parsed.data.status === "fechado") {
    const { data: consultor } = await supabaseAdmin
      .from("consultores")
      .select("nome, fone")
      .eq("id", consultorId)
      .single();
    if (consultor) {
      notificarLeadFechado({
        nomeConsultor: consultor.nome,
        telefoneConsultor: consultor.fone,
        nomeLead: lead.nome_lead ?? "",
      }).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true });
}
