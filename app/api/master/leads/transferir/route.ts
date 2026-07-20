import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { verificarToken } from "@/lib/master-token";
import { z } from "zod";

function auth(req: NextRequest) {
  return verificarToken(req.cookies.get("master_auth")?.value ?? "");
}

const schema = z.object({
  indicacao_ids: z.array(z.string().uuid()).min(1),
  consultor_destino_id: z.string().uuid(),
  motivo: z.string().optional(),
});

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { indicacao_ids, consultor_destino_id, motivo } = parsed.data;

  const { data: destino } = await supabaseAdmin
    .from("consultores")
    .select("id, status")
    .eq("id", consultor_destino_id)
    .eq("status", "ativo")
    .maybeSingle();

  if (!destino) return NextResponse.json({ error: "Consultor destino não encontrado ou inativo" }, { status: 404 });

  const { data: leads, error: errLeads } = await supabaseAdmin
    .from("indicacoes")
    .select("id, consultor_id")
    .in("id", indicacao_ids);

  if (errLeads || !leads?.length) {
    return NextResponse.json({ error: "Leads não encontrados" }, { status: 404 });
  }

  const { error: errUpdate } = await supabaseAdmin
    .from("indicacoes")
    .update({ consultor_id: consultor_destino_id })
    .in("id", indicacao_ids);

  if (errUpdate) return NextResponse.json({ error: errUpdate.message }, { status: 500 });

  const registros = leads.map((l) => ({
    indicacao_id: l.id,
    consultor_origem_id: l.consultor_id,
    consultor_destino_id,
    motivo: motivo ?? null,
    transferido_por_tipo: "master",
  }));

  await supabaseAdmin.from("lead_transferencias").insert(registros);

  return NextResponse.json({ ok: true, transferidos: leads.length });
}
