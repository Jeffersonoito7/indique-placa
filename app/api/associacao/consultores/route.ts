import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getAssociacaoLogada } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

export async function GET() {
  const assoc = await getAssociacaoLogada();
  if (!assoc) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("consultores")
    .select("id, nome, email, fone, status, plano, gestor_id, criado_em")
    .eq("associacao_id", assoc.id)
    .order("criado_em", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[associacao/consultores] GET:", error.code, error.message);
    return NextResponse.json({ error: "Erro ao buscar consultores" }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

const postSchema = z.object({
  nome: z.string().min(2).max(100),
  email: z.string().email(),
  fone: z.string().min(10).max(20),
  senha: z.string().min(6).max(128),
  gestor_id: z.string().uuid().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const assoc = await getAssociacaoLogada();
  if (!assoc) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisicao invalida" }, { status: 400 }); }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });

  const { nome, email, fone, senha, gestor_id } = parsed.data;

  // Verificar limite do plano — se config nao existe, nega por seguranca (fail-safe)
  const { data: planoConfig } = await supabaseAdmin
    .from("planos_config_associacao")
    .select("max_consultores")
    .eq("plano", assoc.plano ?? "trial")
    .maybeSingle();

  if (!planoConfig) {
    return NextResponse.json({ error: "Configuracao de plano nao encontrada. Contate o suporte." }, { status: 403 });
  }

  if (planoConfig.max_consultores !== null && planoConfig.max_consultores !== undefined) {
    const { count } = await supabaseAdmin
      .from("consultores")
      .select("id", { count: "exact", head: true })
      .eq("associacao_id", assoc.id);
    if ((count ?? 0) >= planoConfig.max_consultores) {
      return NextResponse.json(
        { error: `Limite de ${planoConfig.max_consultores} consultores atingido no plano ${assoc.plano ?? "trial"}. Faça upgrade para adicionar mais.` },
        { status: 403 }
      );
    }
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  // Valida que o gestor_id pertence a esta associacao
  let gestorIdFinal: string | null = gestor_id ?? null;
  if (gestorIdFinal) {
    const { data: gestorCheck } = await supabaseAdmin
      .from("gestores")
      .select("id")
      .eq("id", gestorIdFinal)
      .eq("associacao_id", assoc.id)
      .maybeSingle();
    if (!gestorCheck) gestorIdFinal = null;
  }

  const { data, error } = await supabaseAdmin
    .from("consultores")
    .insert({
      nome,
      email: email.toLowerCase(),
      fone: fone.replace(/\D/g, ""),
      senha_hash: senhaHash,
      associacao_id: assoc.id,
      gestor_id: gestorIdFinal,
      status: "ativo",
      plano: "free",
    })
    .select("id, nome, email, fone, status, plano, criado_em")
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Email ja cadastrado" }, { status: 409 });
    console.error("[associacao/consultores] POST:", error.code, error.message);
    return NextResponse.json({ error: "Erro ao criar consultor" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
