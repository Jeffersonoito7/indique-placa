import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  telefone: z.string().min(10).max(20),
  novaSenha: z.string().min(6).max(128),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisição inválida" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Preencha todos os campos corretamente" }, { status: 400 });

  const tel = parsed.data.telefone.replace(/\D/g, "");
  const { novaSenha } = parsed.data;

  const { data: indicador } = await supabaseAdmin
    .from("indicadores")
    .select("id")
    .eq("telefone", tel)
    .single();

  if (!indicador) {
    return NextResponse.json({ ok: true, encontrado: false });
  }

  const hash = await bcrypt.hash(novaSenha, 10);
  await supabaseAdmin.from("indicadores").update({ senha: hash }).eq("id", indicador.id);

  return NextResponse.json({ ok: true, encontrado: true });
}
