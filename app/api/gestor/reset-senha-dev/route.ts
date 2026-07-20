import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  nova_senha: z.string().min(6).max(128),
});

function isDevOnly() {
  // Bloqueia em producao E em qualquer ambiente que nao seja desenvolvimento local explicitamente
  return process.env.NODE_ENV === "development" && !process.env.VERCEL;
}

export async function POST(req: NextRequest) {
  if (!isDevOnly()) {
    return NextResponse.json({ error: "Nao disponivel" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requisicao invalida" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados invalidos", detalhes: parsed.error.flatten() }, { status: 400 });
  }

  const { email, nova_senha } = parsed.data;

  const { data: gestor } = await supabaseAdmin
    .from("gestores")
    .select("id")
    .eq("email", email.toLowerCase())
    .single();

  if (!gestor) {
    return NextResponse.json({ error: "Gestor nao encontrado" }, { status: 404 });
  }

  const hash = await bcrypt.hash(nova_senha, 10);

  const { error } = await supabaseAdmin
    .from("gestores")
    .update({ senha_hash: hash, ativo: true })
    .eq("id", gestor.id);

  if (error) {
    return NextResponse.json({ error: "Falha ao atualizar senha", detalhes: error.message }, { status: 500 });
  }

  // Verifica imediatamente
  const verificado = await bcrypt.compare(nova_senha, hash);

  return NextResponse.json({ ok: true, verificado, hashPrefix: hash.substring(0, 7), mensagem: "Senha atualizada e ativo=true" });
}

export async function GET() {
  if (!isDevOnly()) {
    return NextResponse.json({ error: "Nao disponivel" }, { status: 403 });
  }

  const { data } = await supabaseAdmin
    .from("gestores")
    .select("id, nome, email, ativo, senha_hash")
    .limit(10);

  return NextResponse.json(
    (data ?? []).map((g: { id: string; nome: string; email: string; ativo: boolean; senha_hash: string }) => ({
      id: g.id,
      nome: g.nome,
      email: g.email,
      ativo: g.ativo,
      hashLen: g.senha_hash?.length ?? 0,
      hashPrefix: g.senha_hash?.substring(0, 7) ?? "",
    }))
  );
}
