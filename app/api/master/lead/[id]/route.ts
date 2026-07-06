import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";
import { verificarToken } from "@/lib/master-token";
import { notificarLeadFechado } from "@/lib/whatsapp";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["novo", "contato", "fechado", "perdido"]),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("master_auth")?.value;
  if (!token || !verificarToken(token)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Dados inválidos" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Status inválido" }, { status: 400 });

  const { data: lead } = await supabaseAdmin
    .from("indicacoes")
    .select("id, consultor_id, nome_lead")
    .eq("id", id)
    .single();

  const { error } = await supabaseAdmin
    .from("indicacoes")
    .update({ status: parsed.data.status })
    .eq("id", id);

  if (error) return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });

  // Notifica consultor quando lead e fechado pelo master
  if (parsed.data.status === "fechado" && lead?.consultor_id) {
    supabaseAdmin
      .from("consultores")
      .select("nome, fone")
      .eq("id", lead.consultor_id)
      .single()
      .then(({ data: consultor }) => {
        if (consultor) {
          notificarLeadFechado({
            nomeConsultor: consultor.nome,
            telefoneConsultor: consultor.fone,
            nomeLead: lead.nome_lead ?? "",
          }).catch(() => {});
        }
      });
  }

  return NextResponse.json({ ok: true });
}
