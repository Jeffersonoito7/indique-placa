import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { verificarToken } from "@/lib/master-token";
import { z } from "zod";

function auth(req: NextRequest) {
  return verificarToken(req.cookies.get("master_auth")?.value ?? "");
}

const schemaAssociacao = z.object({
  plano: z.enum(["trial", "bronze", "prata", "ouro"]),
  max_consultores: z.number().int().min(1).nullable(),
  max_gestores: z.number().int().min(1).nullable(),
  max_indicadores: z.number().int().min(1).nullable(),
  campanha_whatsapp: z.boolean(),
  exportar_csv: z.boolean(),
  bi_avancado: z.boolean(),
  webhook_integracao: z.boolean(),
  logo_personalizada: z.boolean(),
  suporte_prioritario: z.boolean(),
});

const schemaConsultor = z.object({
  plano: z.enum(["free", "pro"]),
  max_indicadores: z.number().int().min(1).nullable(),
  campanha_whatsapp: z.boolean(),
  exportar_csv: z.boolean(),
  metas_bonus: z.boolean(),
  link_captura_proprio: z.boolean(),
  ranking_visivel: z.boolean(),
});

const schemaGestor = z.object({
  plano: z.enum(["free", "pro"]),
  max_consultores: z.number().int().min(1).nullable(),
  relatorios_equipe: z.boolean(),
  exportar_csv: z.boolean(),
  link_captura_proprio: z.boolean(),
});

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const [
    { data: associacao },
    { data: consultor },
    { data: gestor },
  ] = await Promise.all([
    supabaseAdmin.from("planos_config_associacao").select("*").order("plano"),
    supabaseAdmin.from("planos_config_consultor").select("*").order("plano"),
    supabaseAdmin.from("planos_config_gestor").select("*").order("plano"),
  ]);

  return NextResponse.json({ associacao: associacao ?? [], consultor: consultor ?? [], gestor: gestor ?? [] });
}

export async function PUT(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const { tipo, dados } = (body ?? {}) as { tipo: string; dados: unknown };

  if (tipo === "associacao") {
    const parsed = schemaAssociacao.safeParse(dados);
    if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    const { plano, ...rest } = parsed.data;
    const { error } = await supabaseAdmin
      .from("planos_config_associacao")
      .update({ ...rest, atualizado_em: new Date().toISOString() })
      .eq("plano", plano);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (tipo === "consultor") {
    const parsed = schemaConsultor.safeParse(dados);
    if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    const { plano, ...rest } = parsed.data;
    const { error } = await supabaseAdmin
      .from("planos_config_consultor")
      .update({ ...rest, atualizado_em: new Date().toISOString() })
      .eq("plano", plano);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (tipo === "gestor") {
    const parsed = schemaGestor.safeParse(dados);
    if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    const { plano, ...rest } = parsed.data;
    const { error } = await supabaseAdmin
      .from("planos_config_gestor")
      .update({ ...rest, atualizado_em: new Date().toISOString() })
      .eq("plano", plano);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
}
