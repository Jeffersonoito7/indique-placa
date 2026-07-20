import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { verificarToken } from "@/lib/master-token";

function auth(req: NextRequest) {
  return verificarToken(req.cookies.get("master_auth")?.value ?? "");
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const url = req.nextUrl;
  const associacao_id = url.searchParams.get("associacao_id");
  const gestor_id = url.searchParams.get("gestor_id");
  const status = url.searchParams.get("status");
  const plano = url.searchParams.get("plano");

  let query = supabaseAdmin
    .from("consultores")
    .select(
      `id, nome, email, fone, status, plano, created_at,
       associacoes(id, nome),
       gestores(id, nome),
       indicacoes(id, status)`,
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (associacao_id) query = query.eq("associacao_id", associacao_id);
  if (gestor_id) query = query.eq("gestor_id", gestor_id);
  if (status) query = query.eq("status", status);
  if (plano) query = query.eq("plano", plano);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const lista = (data ?? []).map((c) => {
    const leads = Array.isArray(c.indicacoes) ? c.indicacoes : [];
    return {
      id: c.id,
      nome: c.nome,
      email: c.email,
      fone: c.fone,
      status: c.status,
      plano: c.plano,
      created_at: c.created_at,
      associacao: (c.associacoes as unknown as { id: string; nome: string } | null)?.nome ?? null,
      associacao_id: (c.associacoes as unknown as { id: string; nome: string } | null)?.id ?? null,
      gestor: (c.gestores as unknown as { id: string; nome: string } | null)?.nome ?? null,
      gestor_id: (c.gestores as unknown as { id: string; nome: string } | null)?.id ?? null,
      total_leads: leads.length,
      total_fechados: leads.filter((l: { status: string }) => l.status === "fechado").length,
    };
  });

  return NextResponse.json({ lista });
}
