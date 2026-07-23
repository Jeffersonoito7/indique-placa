import { NextRequest, NextResponse } from "next/server";
import { getAssociacaoLogada } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schemaPatch = z.object({
  nome: z.string().min(2).max(100),
  fone: z.string().min(10).max(20),
  cidade: z.string().min(2).max(100).optional().nullable(),
  estado: z.string().length(2).optional().nullable(),
  nova_senha: z.string().min(6).max(128).optional().nullable(),
  senha_atual: z.string().min(1).max(128).optional().nullable(),
});

export async function GET() {
  const assoc = await getAssociacaoLogada();
  if (!assoc) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  return NextResponse.json({ associacao: assoc });
}

export async function PATCH(req: NextRequest) {
  const assoc = await getAssociacaoLogada();
  if (!assoc) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Requisicao invalida" }, { status: 400 });
  }

  const parsed = schemaPatch.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });

  const { nome, fone, cidade, estado, nova_senha, senha_atual } = parsed.data;

  const updates: Record<string, unknown> = {
    nome,
    fone: fone.replace(/\D/g, ""),
    cidade: cidade ?? null,
    estado: estado ?? null,
    atualizado_em: new Date().toISOString(),
  };

  if (nova_senha) {
    if (!senha_atual) {
      return NextResponse.json({ error: "Informe a senha atual para alterar a senha" }, { status: 400 });
    }

    const { data: assocDb } = await supabaseAdmin
      .from("associacoes")
      .select("senha_hash")
      .eq("id", assoc.id)
      .single();

    const senhaHash = (assocDb as Record<string, unknown>)?.senha_hash as string | null;

    let senhaCorreta = false;
    if (senhaHash) {
      senhaCorreta = await bcrypt.compare(senha_atual, senhaHash);
    } else {
      senhaCorreta = senha_atual === (process.env.ASSOCIACAO_MASTER_SENHA ?? "");
    }

    if (!senhaCorreta) {
      return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 });
    }

    updates.senha_hash = await bcrypt.hash(nova_senha, 10);
  }

  const { error } = await supabaseAdmin
    .from("associacoes")
    .update(updates)
    .eq("id", assoc.id);

  if (error) return NextResponse.json({ error: "Erro ao salvar alteracoes" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
