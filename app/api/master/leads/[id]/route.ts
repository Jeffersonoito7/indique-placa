import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { verificarToken } from "@/lib/master-token";
import { z } from "zod";

function auth(req: NextRequest) {
  return verificarToken(req.cookies.get("master_auth")?.value ?? "");
}

const schemaAtualizar = z.object({
  status: z.enum(["novo", "contato", "fechado", "perdido"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!auth(req)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = schemaAtualizar.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const updatePayload: Record<string, unknown> = { ...parsed.data };

  // Calcula comissao_valor ao fechar (apenas se ainda nao calculado)
  if (parsed.data.status === "fechado") {
    const { data: lead } = await supabaseAdmin
      .from("indicacoes")
      .select("consultor_id, tipo_veiculo, comissao_valor")
      .eq("id", id)
      .single();

    if (lead && !lead.comissao_valor) {
      const tipoVeiculo = (lead.tipo_veiculo as string | null) ?? "carro";
      const { data: comissaoConfig } = await supabaseAdmin
        .from("comissoes_tipos")
        .select("comissao_indicador")
        .eq("consultor_id", lead.consultor_id)
        .eq("tipo", tipoVeiculo)
        .single();

      const fallback: Record<string, number> = { moto: 50, carro: 100, caminhao: 500 };
      updatePayload.comissao_valor = comissaoConfig?.comissao_indicador ?? fallback[tipoVeiculo] ?? 100;
    }
  }

  const { data, error } = await supabaseAdmin
    .from("indicacoes")
    .update(updatePayload)
    .eq("id", id)
    .select("id, status, consultor_id, comissao_valor")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ lead: data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!auth(req)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;

  const { error } = await supabaseAdmin
    .from("indicacoes")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
