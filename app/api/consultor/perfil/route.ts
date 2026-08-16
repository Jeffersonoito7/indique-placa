import { NextRequest, NextResponse } from "next/server";
import { getConsultorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  nome: z.string().min(2).max(100),
  sobrenome: z.string().min(0).max(100).optional().default(""),
  fone: z.string().min(10).max(20),
  nova_senha: z.string().min(6).max(128).optional().nullable(),
  senha_atual: z.string().min(1).max(128).optional().nullable(),
});

export async function PATCH(req: NextRequest) {
  const consultor = await getConsultorLogado();
  if (!consultor) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisição inválida" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { nome, sobrenome, fone, nova_senha, senha_atual } = parsed.data;
  const foneNumeros = fone.replace(/\D/g, "");

  const updates: Record<string, unknown> = {
    nome,
    sobrenome: sobrenome || null,
    fone: foneNumeros,
  };

  if (nova_senha) {
    if (!senha_atual) {
      return NextResponse.json({ error: "Informe a senha atual para alterar a senha" }, { status: 400 });
    }

    const { data: consultorDb } = await supabaseAdmin
      .from("consultores")
      .select("senha_hash")
      .eq("id", consultor.id)
      .single();

    const senhaCorreta = consultorDb?.senha_hash
      ? await bcrypt.compare(senha_atual, consultorDb.senha_hash)
      : false;

    if (!senhaCorreta) {
      return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 });
    }

    updates.senha_hash = await bcrypt.hash(nova_senha, 10);
  }

  const { error } = await supabaseAdmin
    .from("consultores")
    .update(updates)
    .eq("id", consultor.id);

  if (error) return NextResponse.json({ error: "Erro ao atualizar perfil" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
