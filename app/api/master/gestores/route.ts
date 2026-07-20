import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { verificarToken } from "@/lib/master-token";
import { z } from "zod";
import bcrypt from "bcryptjs";

function auth(req: NextRequest) {
  return verificarToken(req.cookies.get("master_auth")?.value ?? "");
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const associacao_id = req.nextUrl.searchParams.get("associacao_id");

  let query = supabaseAdmin
    .from("gestores")
    .select(`id, nome, email, fone, ativo, plano, plano_ativo_ate, criado_em, associacao_id, associacoes(id, nome)`)
    .order("criado_em", { ascending: false });

  if (associacao_id) query = query.eq("associacao_id", associacao_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const lista = (data ?? []).map((g) => ({
    id: g.id,
    nome: g.nome,
    email: g.email,
    fone: g.fone ?? null,
    ativo: g.ativo,
    plano: g.plano ?? "free",
    plano_ativo_ate: g.plano_ativo_ate ?? null,
    criado_em: g.criado_em,
    associacao_id: g.associacao_id ?? null,
    associacao: Array.isArray(g.associacoes)
      ? (g.associacoes[0]?.nome ?? null)
      : ((g.associacoes as { nome?: string } | null)?.nome ?? null),
  }));

  return NextResponse.json(lista);
}

const schemaCriar = z.object({
  nome: z.string().min(2).max(100),
  email: z.string().email().max(200),
  fone: z.string().max(20).optional(),
  senha: z.string().min(6).max(128),
  associacao_id: z.string().uuid().optional().nullable(),
  plano: z.enum(["free", "pro"]).default("free"),
});

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Dados inválidos" }, { status: 400 }); }

  const parsed = schemaCriar.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Preencha todos os campos obrigatorios.", detalhes: parsed.error.flatten() }, { status: 400 });

  const { nome, email, fone, senha, associacao_id, plano } = parsed.data;

  const { data: existente } = await supabaseAdmin
    .from("gestores")
    .select("id")
    .eq("email", email.toLowerCase())
    .single();

  if (existente) return NextResponse.json({ error: "Este e-mail ja esta cadastrado." }, { status: 409 });

  const senha_hash = await bcrypt.hash(senha, 10);

  const { data, error } = await supabaseAdmin
    .from("gestores")
    .insert({ nome: nome.trim(), email: email.toLowerCase().trim(), fone: fone ?? null, senha_hash, ativo: true, plano, associacao_id: associacao_id ?? null })
    .select("id, nome, email")
    .single();

  if (error || !data) return NextResponse.json({ error: "Erro ao criar gestor." }, { status: 500 });

  return NextResponse.json({ ok: true, gestor: data }, { status: 201 });
}
