import { NextRequest, NextResponse } from "next/server";
import { getGestorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { z } from "zod";

// ─── GET /api/gestor/meus-leads ───────────────────────────────────────────────
// Lista os leads PROPRIOS do gestor (consultor_id = null, gestor_id = gestor.id)
// Filtros: status, busca (placa/nome), paginacao page/limit
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const gestor = await getGestorLogado();
  if (!gestor) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const statusFiltro = searchParams.get("status");
  const busca = searchParams.get("busca");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
  const offset = (page - 1) * limit;

  // Query paginada com filtros
  let query = supabaseAdmin
    .from("indicacoes")
    .select(
      "id, placa, nome_lead, telefone_lead, tipo_veiculo, status, criado_em, gestor_id, consultor_id",
      { count: "exact" }
    )
    .eq("gestor_id", gestor.id)
    .is("consultor_id", null)
    .order("criado_em", { ascending: false })
    .range(offset, offset + limit - 1);

  if (statusFiltro && statusFiltro !== "todos") {
    query = query.eq("status", statusFiltro);
  }
  if (busca) {
    const buscaSegura = busca.replace(/[%_,.()"'\\]/g, "\\$&").slice(0, 100);
    query = query.or(`placa.ilike.%${buscaSegura}%,nome_lead.ilike.%${buscaSegura}%`);
  }

  const { data, count, error } = await query;

  if (error) return NextResponse.json({ error: "Erro ao buscar leads" }, { status: 500 });

  // Totais via contagem no banco — evita carregar todas as linhas em memoria
  const bs = busca ? busca.replace(/[%_,.()"'\\]/g, "\\$&").slice(0, 100) : null;

  let totQ1 = supabaseAdmin
    .from("indicacoes")
    .select("id", { count: "exact", head: true })
    .eq("gestor_id", gestor.id)
    .is("consultor_id", null);
  let totQ2 = supabaseAdmin
    .from("indicacoes")
    .select("id", { count: "exact", head: true })
    .eq("gestor_id", gestor.id)
    .is("consultor_id", null);
  let totQ3 = supabaseAdmin
    .from("indicacoes")
    .select("id", { count: "exact", head: true })
    .eq("gestor_id", gestor.id)
    .is("consultor_id", null);

  if (bs) {
    totQ1 = totQ1.or(`placa.ilike.%${bs}%,nome_lead.ilike.%${bs}%`);
    totQ2 = totQ2.or(`placa.ilike.%${bs}%,nome_lead.ilike.%${bs}%`);
    totQ3 = totQ3.or(`placa.ilike.%${bs}%,nome_lead.ilike.%${bs}%`);
  }
  totQ2 = totQ2.in("status", ["novo", "contato"]);
  totQ3 = totQ3.eq("status", "fechado");

  const [{ count: cTotal }, { count: cEmAndamento }, { count: cFechados }] = await Promise.all([
    totQ1,
    totQ2,
    totQ3,
  ]);

  const totalGlobal = cTotal ?? 0;
  const em_andamento = cEmAndamento ?? 0;
  const fechados = cFechados ?? 0;
  const taxa = totalGlobal > 0 ? Math.round((fechados / totalGlobal) * 100) : 0;

  return NextResponse.json({
    leads: data ?? [],
    total: count ?? 0,
    totais: { total: totalGlobal, em_andamento, fechados, taxa },
  });
}

// ─── POST /api/gestor/meus-leads ─────────────────────────────────────────────
// Cria um lead proprio do gestor (consultor_id = null)
// ─────────────────────────────────────────────────────────────────────────────
const criarLeadSchema = z.object({
  placa: z.string().min(1).max(20),
  nome_lead: z.string().min(1).max(255),
  telefone_lead: z.string().min(1).max(30),
  tipo_veiculo: z.string().min(1).max(100),
});

export async function POST(req: NextRequest) {
  const gestor = await getGestorLogado();
  if (!gestor) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisicao invalido" }, { status: 400 });
  }

  const parsed = criarLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados invalidos", detalhes: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { placa, nome_lead, telefone_lead, tipo_veiculo } = parsed.data;

  const { data, error } = await supabaseAdmin
    .from("indicacoes")
    .insert({
      placa,
      nome_lead,
      telefone_lead,
      tipo_veiculo,
      status: "novo",
      gestor_id: gestor.id,
      consultor_id: null,
    })
    .select("id, placa, nome_lead, telefone_lead, tipo_veiculo, status, criado_em, gestor_id, consultor_id")
    .single();

  if (error) return NextResponse.json({ error: "Erro ao criar lead" }, { status: 500 });

  return NextResponse.json({ lead: data }, { status: 201 });
}
