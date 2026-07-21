import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { verificarToken } from "@/lib/master-token";
import bcrypt from "bcryptjs";
import { z } from "zod";

function auth(req: NextRequest) {
  return verificarToken(req.cookies.get("master_auth")?.value ?? "");
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!auth(req)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("associacoes")
    .select("id, nome, slug, email, fone, cidade, estado, logo_url, status, plano, plano_ativo_ate, cobranca_ativa, valor_mensalidade_associacao, valor_mensalidade_gestor, valor_mensalidade_consultor_pro, efi_client_id, efi_pix_key, criado_em, atualizado_em")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });

  return NextResponse.json({ associacao: data });
}

const schemaAtualizar = z.object({
  nome: z.string().min(2).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  email: z.string().email().optional().or(z.literal("")).optional(),
  fone: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  logo_url: z.string().optional(),
  status: z.enum(["ativo", "inativo", "trial", "suspenso"]).optional(),
  plano: z.enum(["trial", "bronze", "prata", "ouro"]).optional(),
  plano_ativo_ate: z.string().optional(),
  cobranca_ativa: z.boolean().optional(),
  valor_mensalidade_associacao: z.number().min(0).optional(),
  valor_mensalidade_gestor: z.number().min(0).optional(),
  valor_mensalidade_consultor_pro: z.number().min(0).optional(),
  efi_client_id: z.string().optional(),
  efi_client_secret: z.string().optional(),
  efi_pix_key: z.string().optional(),
  nova_senha: z.string().min(6).max(128).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!auth(req)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = schemaAtualizar.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { nova_senha, ...resto } = parsed.data;
  const updates: Record<string, unknown> = { ...resto, atualizado_em: new Date().toISOString() };
  if (nova_senha) {
    updates.senha_hash = await bcrypt.hash(nova_senha, 10);
  }
  delete updates.nova_senha;

  const { data, error } = await supabaseAdmin
    .from("associacoes")
    .update(updates)
    .eq("id", id)
    .select("id, nome, slug, status, plano, atualizado_em")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ associacao: data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!auth(req)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;

  const { error } = await supabaseAdmin
    .from("associacoes")
    .update({ status: "inativo", atualizado_em: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
