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
  const consultor_id = url.searchParams.get("consultor_id");
  const status = url.searchParams.get("status");
  const de = url.searchParams.get("de");
  const ate = url.searchParams.get("ate");
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get("limit") ?? "50", 10)));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabaseAdmin
    .from("indicacoes")
    .select(
      `id, placa, nome_lead, telefone_lead, status, criado_em,
       consultor_id,
       consultores(id, nome),
       indicadores(id, nome),
       associacoes(id, nome),
       associacao_id`,
      { count: "exact" }
    )
    .order("criado_em", { ascending: false })
    .range(from, to);

  if (associacao_id) query = query.eq("associacao_id", associacao_id);
  if (consultor_id) query = query.eq("consultor_id", consultor_id);
  if (status) query = query.eq("status", status);
  if (de) query = query.gte("criado_em", de);
  if (ate) query = query.lte("criado_em", ate);

  const { data, count, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ lista: data ?? [], total: count ?? 0, page, limit });
}
