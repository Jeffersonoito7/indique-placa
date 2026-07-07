import { NextRequest, NextResponse } from "next/server";
import { getIndicadorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { z } from "zod";

export async function GET() {
  const indicador = await getIndicadorLogado();
  if (!indicador) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { data } = await supabaseAdmin
    .from("indicadores")
    .select("id, nome, telefone, chave_pix")
    .eq("id", indicador.id)
    .single();

  return NextResponse.json(data ?? {});
}

const schema = z.object({
  chave_pix: z.string().max(200).optional().nullable(),
});

export async function PATCH(req: NextRequest) {
  const indicador = await getIndicadorLogado();
  if (!indicador) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisição inválida" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("indicadores")
    .update({ chave_pix: parsed.data.chave_pix ?? null })
    .eq("id", indicador.id);

  if (error) return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
