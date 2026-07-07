import { NextRequest, NextResponse } from "next/server";
import { getConsultorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { z } from "zod";

const schema = z.object({
  nome: z.string().min(2).max(100),
  sobrenome: z.string().min(0).max(100).optional().default(""),
  fone: z.string().min(10).max(20),
});

export async function PATCH(req: NextRequest) {
  const consultor = await getConsultorLogado();
  if (!consultor) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisicao invalida" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });

  const { nome, sobrenome, fone } = parsed.data;
  const foneNumeros = fone.replace(/\D/g, "");

  const { error } = await supabaseAdmin
    .from("consultores")
    .update({ nome, sobrenome: sobrenome || null, fone: foneNumeros })
    .eq("id", consultor.id);

  if (error) return NextResponse.json({ error: "Erro ao atualizar perfil" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
