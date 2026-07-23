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

  const { data, error } = await supabaseAdmin
    .from("associacoes")
    .select(`
      id, nome, slug, status, plano, cidade, estado, criado_em,
      gestores(id),
      consultores(id),
      indicadores(id),
      indicacoes(id)
    `)
    .order("criado_em", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const lista = (data ?? []).map((a) => ({
    id: a.id,
    nome: a.nome,
    slug: a.slug,
    status: a.status,
    plano: a.plano,
    cidade: a.cidade,
    estado: a.estado,
    criado_em: a.criado_em,
    total_gestores: Array.isArray(a.gestores) ? a.gestores.length : 0,
    total_consultores: Array.isArray(a.consultores) ? a.consultores.length : 0,
    total_indicadores: Array.isArray(a.indicadores) ? a.indicadores.length : 0,
    total_leads: Array.isArray(a.indicacoes) ? a.indicacoes.length : 0,
  }));

  return NextResponse.json({ lista });
}

const schemaCriar = z.object({
  nome: z.string().min(2),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minusculas, numeros e hifens"),
  email: z.string().email().optional().or(z.literal("")),
  fone: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  plano: z.enum(["trial", "bronze", "prata", "ouro"]).default("trial"),
  nova_senha: z.string().min(6).max(128).optional(),
});

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schemaCriar.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { nome, slug, email, fone, cidade, estado, plano, nova_senha } = parsed.data;

  const { data: existente } = await supabaseAdmin
    .from("associacoes")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existente) return NextResponse.json({ error: "Slug ja esta em uso" }, { status: 409 });

  const senhaHash = nova_senha ? await bcrypt.hash(nova_senha, 10) : null;

  const { data, error } = await supabaseAdmin
    .from("associacoes")
    .insert({
      nome, slug, email: email || null, fone, cidade, estado, plano,
      ...(senhaHash ? { senha_hash: senhaHash } : {}),
    })
    .select("id, nome, slug, status, plano, criado_em")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ associacao: data }, { status: 201 });
}
