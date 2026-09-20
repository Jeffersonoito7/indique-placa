import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getConsultorLogado } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

export async function GET() {
  const consultor = await getConsultorLogado();
  if (!consultor) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("indicadores")
    .select("id, nome, telefone, chave_pix, criado_em")
    .eq("consultor_id", consultor.id)
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("[consultor/indicadores] GET:", error.code, error.message);
    return NextResponse.json({ error: "Erro ao buscar indicadores" }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

const postSchema = z.object({
  nome: z.string().min(2).max(100),
  email: z.string().email().optional(),
  telefone: z.string().min(10).max(20),
  senha: z.string().min(6).max(128),
});

export async function POST(req: NextRequest) {
  const consultor = await getConsultorLogado();
  if (!consultor) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisição inválida" }, { status: 400 }); }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { nome, email, telefone, senha } = parsed.data;

  // Verificar limite do plano.
  // Antes, plano sem linha em planos_config_consultor fazia o limite deixar de
  // ser aplicado, liberando de graça o que é pago. Agora config ausente nega.
  const plano = (consultor as { plano?: string }).plano ?? "free";
  const { data: planoConfig, error: erroPlano } = await supabaseAdmin
    .from("planos_config_consultor")
    .select("max_indicadores")
    .eq("plano", plano)
    .maybeSingle();

  if (erroPlano || !planoConfig) {
    console.error("[indicadores] plano sem configuracao", { plano, erro: erroPlano?.message });
    return NextResponse.json(
      { error: "Não foi possível validar os limites do seu plano. Fale com o suporte." },
      { status: 503 }
    );
  }

  // null continua significando ilimitado, como sempre foi.
  if (planoConfig.max_indicadores !== null) {
    const { count } = await supabaseAdmin
      .from("indicadores")
      .select("id", { count: "exact", head: true })
      .eq("consultor_id", consultor.id);
    if ((count ?? 0) >= planoConfig.max_indicadores) {
      return NextResponse.json(
        { error: `Limite de ${planoConfig.max_indicadores} indicadores atingido no seu plano. Faça upgrade Pro para adicionar mais.` },
        { status: 403 }
      );
    }
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  const { data, error } = await supabaseAdmin
    .from("indicadores")
    .insert({
      nome,
      email: email ? email.toLowerCase() : null,
      telefone: telefone.replace(/\D/g, ""),
      senha: senhaHash,
      consultor_id: consultor.id,
      associacao_id: (consultor as { associacao_id?: string | null }).associacao_id ?? null,
    })
    .select("id, nome, telefone, chave_pix, criado_em")
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Telefone ja cadastrado" }, { status: 409 });
    console.error("[consultor/indicadores] POST:", error.code, error.message);
    return NextResponse.json({ error: "Erro ao criar indicador" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
