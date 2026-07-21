import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getAssociacaoLogada } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

export async function GET() {
  const assoc = await getAssociacaoLogada();
  if (!assoc) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("gestores")
    .select("id, nome, email, fone, ativo, criado_em")
    .eq("associacao_id", assoc.id)
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("[associacao/gestores] GET:", error.code, error.message);
    return NextResponse.json({ error: "Erro ao buscar gestores" }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

const postSchema = z.object({
  nome: z.string().min(2).max(100),
  email: z.string().email(),
  fone: z.string().min(10).max(20),
  senha: z.string().min(6).max(128),
});

export async function POST(req: NextRequest) {
  const assoc = await getAssociacaoLogada();
  if (!assoc) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisicao invalida" }, { status: 400 }); }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });

  const { nome, email, fone, senha } = parsed.data;
  const senhaHash = await bcrypt.hash(senha, 10);

  const { data, error } = await supabaseAdmin
    .from("gestores")
    .insert({
      nome,
      email: email.toLowerCase(),
      fone: fone.replace(/\D/g, ""),
      senha_hash: senhaHash,
      associacao_id: assoc.id,
      ativo: true,
    })
    .select("id, nome, email, fone, ativo, criado_em")
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Email ja cadastrado" }, { status: 409 });
    console.error("[associacao/gestores] POST:", error.code, error.message);
    return NextResponse.json({ error: "Erro ao criar gestor" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
