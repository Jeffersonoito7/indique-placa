import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";
import { verificarToken } from "@/lib/master-token";
import { z } from "zod";

const schema = z.object({
  valor_consultor_mensal: z.number().min(0).max(99999),
  valor_consultor_anual: z.number().min(0).max(99999),
  cobranca_consultor_ativa: z.boolean(),
  valor_associacao_trial: z.number().min(0).max(99999),
  valor_associacao_bronze: z.number().min(0).max(99999),
  valor_associacao_prata: z.number().min(0).max(99999),
  valor_associacao_ouro: z.number().min(0).max(99999),
  cobranca_associacao_ativa: z.boolean(),
});

async function autenticar() {
  const cookieStore = await cookies();
  const token = cookieStore.get("master_auth")?.value;
  return token && verificarToken(token);
}

export async function GET() {
  if (!(await autenticar())) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  const { data } = await supabaseAdmin
    .from("configuracoes_master")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  return NextResponse.json({ config: data ?? null });
}

export async function PUT(req: NextRequest) {
  if (!(await autenticar())) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Dados invalidos" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados invalidos", detalhe: parsed.error.flatten() }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("configuracoes_master")
    .upsert({ id: 1, ...parsed.data, atualizado_em: new Date().toISOString() }, { onConflict: "id" });

  if (error) return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
