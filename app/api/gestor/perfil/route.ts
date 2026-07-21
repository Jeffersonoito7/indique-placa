import { NextRequest, NextResponse } from "next/server";
import { getGestorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  nome: z.string().min(2).max(100),
  fone: z.string().min(10).max(20).optional().nullable(),
  nova_senha: z.string().min(6).max(128).optional().nullable(),
  senha_atual: z.string().min(1).max(128).optional().nullable(),
});

export async function GET() {
  const gestor = await getGestorLogado();
  if (!gestor) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const { data } = await supabaseAdmin
    .from("gestores")
    .select("id, nome, email, fone, plano, plano_ativo_ate, criado_em")
    .eq("id", gestor.id)
    .single();

  return NextResponse.json(data ?? {});
}

export async function PATCH(req: NextRequest) {
  const gestor = await getGestorLogado();
  if (!gestor) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Requisicao invalida" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });

  const { nome, fone, nova_senha, senha_atual } = parsed.data;
  const updates: Record<string, unknown> = {
    nome,
    fone: fone ? fone.replace(/\D/g, "") : null,
  };

  if (nova_senha) {
    if (!senha_atual) {
      return NextResponse.json({ error: "Informe a senha atual para alterar a senha" }, { status: 400 });
    }

    const { data: gestorDb } = await supabaseAdmin
      .from("gestores")
      .select("senha_hash")
      .eq("id", gestor.id)
      .single();

    const senhaCorreta = gestorDb?.senha_hash
      ? await bcrypt.compare(senha_atual, gestorDb.senha_hash)
      : false;

    if (!senhaCorreta) {
      return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 });
    }

    updates.senha_hash = await bcrypt.hash(nova_senha, 10);
  }

  const { error } = await supabaseAdmin
    .from("gestores")
    .update(updates)
    .eq("id", gestor.id);

  if (error) return NextResponse.json({ error: "Erro ao atualizar perfil" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
