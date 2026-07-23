import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getGestorLogado } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

export async function GET() {
  const gestor = await getGestorLogado();
  if (!gestor) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  // Buscar consultores do gestor
  const { data: consultores } = await supabaseAdmin
    .from("consultores")
    .select("id")
    .eq("gestor_id", gestor.id);

  const ids = (consultores ?? []).map((c) => c.id);

  if (ids.length === 0) return NextResponse.json([]);

  const { data, error } = await supabaseAdmin
    .from("indicadores")
    .select("id, nome, telefone, consultor_id, criado_em")
    .in("consultor_id", ids)
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("[gestor/indicadores] GET:", error.code, error.message);
    return NextResponse.json({ error: "Erro ao buscar indicadores" }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

const postSchema = z.object({
  nome: z.string().min(2).max(100),
  email: z.string().email().optional(),
  telefone: z.string().min(10).max(20),
  senha: z.string().min(6).max(128),
  consultor_id: z.string().uuid().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const gestor = await getGestorLogado();
  if (!gestor) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisicao invalida" }, { status: 400 }); }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });

  const { nome, email, telefone, senha, consultor_id } = parsed.data;
  const senhaHash = await bcrypt.hash(senha, 10);

  // Valida que o consultor_id pertence a este gestor
  let consultorIdFinal: string | null = consultor_id ?? null;
  if (consultorIdFinal) {
    const { data: consultorCheck } = await supabaseAdmin
      .from("consultores")
      .select("id")
      .eq("id", consultorIdFinal)
      .eq("gestor_id", gestor.id)
      .maybeSingle();
    if (!consultorCheck) consultorIdFinal = null;
  }

  const { data, error } = await supabaseAdmin
    .from("indicadores")
    .insert({
      nome,
      email: email ? email.toLowerCase() : null,
      telefone: telefone.replace(/\D/g, ""),
      senha: senhaHash,
      consultor_id: consultorIdFinal,
    })
    .select("id, nome, telefone, criado_em")
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Telefone ja cadastrado" }, { status: 409 });
    console.error("[gestor/indicadores] POST:", error.code, error.message);
    return NextResponse.json({ error: "Erro ao criar indicador" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
