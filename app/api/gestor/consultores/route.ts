import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getGestorLogado } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

export async function GET() {
  const gestor = await getGestorLogado();
  if (!gestor) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  const { data: consultores, error } = await supabaseAdmin
    .from("consultores")
    .select("id, nome, email, fone, status, plano, plano_ativo_ate, criado_em")
    .eq("gestor_id", gestor.id)
    .order("criado_em", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: "Erro ao buscar consultores" }, { status: 500 });

  // Buscar contagem de indicacoes por consultor
  const ids = (consultores ?? []).map((c) => c.id);

  const { data: indicacoes } = await supabaseAdmin
    .from("indicacoes")
    .select("consultor_id, status")
    .in("consultor_id", ids.length > 0 ? ids : ["00000000-0000-0000-0000-000000000000"])
    .limit(5000);

  const contagemMap: Record<string, { leads: number; fechados: number }> = {};
  for (const ind of indicacoes ?? []) {
    if (!contagemMap[ind.consultor_id]) contagemMap[ind.consultor_id] = { leads: 0, fechados: 0 };
    contagemMap[ind.consultor_id].leads++;
    if (ind.status === "fechado") contagemMap[ind.consultor_id].fechados++;
  }

  const resultado = (consultores ?? []).map((c) => ({
    ...c,
    leads: contagemMap[c.id]?.leads ?? 0,
    fechados: contagemMap[c.id]?.fechados ?? 0,
  }));

  return NextResponse.json(resultado);
}

const postSchema = z.object({
  nome: z.string().min(2).max(100),
  email: z.string().email(),
  fone: z.string().min(10).max(20),
  senha: z.string().min(6).max(128),
});

export async function POST(req: NextRequest) {
  const gestor = await getGestorLogado();
  if (!gestor) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisição inválida" }, { status: 400 }); }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  // Verificar limite do plano antes de criar consultor
  const { data: planoConfig } = await supabaseAdmin
    .from("planos_config_gestor")
    .select("max_consultores")
    .eq("plano", (gestor as { plano?: string }).plano ?? "free")
    .maybeSingle();

  if (!planoConfig) {
    return NextResponse.json({ error: "Configuracao de plano nao encontrada. Contate o suporte." }, { status: 403 });
  }

  if (planoConfig.max_consultores !== null && planoConfig.max_consultores !== undefined) {
    const { count } = await supabaseAdmin
      .from("consultores")
      .select("id", { count: "exact", head: true })
      .eq("gestor_id", gestor.id);
    if ((count ?? 0) >= planoConfig.max_consultores) {
      return NextResponse.json(
        { error: `Limite de ${planoConfig.max_consultores} consultores na equipe atingido no seu plano. Solicite upgrade ao administrador.` },
        { status: 403 }
      );
    }
  }

  const { nome, email, fone, senha } = parsed.data;
  const tel = fone.replace(/\D/g, "");
  const senhaHash = await bcrypt.hash(senha, 12);

  const { data, error } = await supabaseAdmin
    .from("consultores")
    .insert({
      nome,
      email: email.toLowerCase(),
      fone: tel,
      senha_hash: senhaHash,
      gestor_id: gestor.id,
      status: "ativo",
      plano: "free",
    })
    .select("id, nome, email, fone, status, plano, criado_em")
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Email ou telefone ja cadastrado" }, { status: 409 });
    return NextResponse.json({ error: "Erro ao criar consultor" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
