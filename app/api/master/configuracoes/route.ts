import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";
import { verificarToken } from "@/lib/master-token";
import { z } from "zod";

const schema = z.object({
  nome_plataforma: z.string().min(1).max(100),
  site: z.string().max(200).optional().nullable(),
  email: z.string().email().max(200).optional().nullable(),
  telefone: z.string().max(30).optional().nullable(),
  endereco: z.string().max(300).optional().nullable(),
  comissao_consultor: z.number().min(0).max(99999).optional().nullable(),
  comissao_indicador: z.number().min(0).max(99999).optional().nullable(),
});

async function autenticar() {
  const cookieStore = await cookies();
  const token = cookieStore.get("master_auth")?.value;
  return token && verificarToken(token);
}

export async function GET() {
  if (!(await autenticar())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { data } = await supabaseAdmin.from("configuracoes").select("*").limit(1).single();
  return NextResponse.json({ config: data ?? null });
}

export async function PUT(req: NextRequest) {
  if (!(await autenticar())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Dados inválidos" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos", detalhe: parsed.error.flatten() }, { status: 400 });

  const { data: existente } = await supabaseAdmin.from("configuracoes").select("id").limit(1).single();

  let error;
  if (existente) {
    ({ error } = await supabaseAdmin.from("configuracoes").update(parsed.data).eq("id", existente.id));
  } else {
    ({ error } = await supabaseAdmin.from("configuracoes").insert(parsed.data));
  }

  if (error) return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
