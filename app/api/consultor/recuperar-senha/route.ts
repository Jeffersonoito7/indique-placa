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

  const { data: consultor } = await supabaseAdmin
    .from("consultores")
    .select("id")
    .eq("fone", tel)
    .single();

  if (!consultor) {
    return NextResponse.json({ ok: true, encontrado: false });
  }

  const hash = await bcrypt.hash(novaSenha, 10);
  await supabaseAdmin.from("consultores").update({ senha: hash }).eq("id", consultor.id);

  return NextResponse.json({ ok: true, encontrado: true });
}
