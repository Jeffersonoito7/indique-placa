import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";
import { validarSessao } from "@/lib/sessoes";

const CAMPOS =
  "id, placa, nome_lead, telefone_lead, status, criado_em, tipo_veiculo, pago_em, comprovante_url, valor_pago, indicadores(nome, chave_pix)";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("consultor_auth")?.value;
  if (!token) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const consultorId = await validarSessao(token, "consultor");
  if (!consultorId) return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const pageParam = searchParams.get("page");

  // Modo legado: sem "page" => retorna os ultimos 500 leads (usado pelo kanban)
  // Limite evita timeout em consultores com volume alto
  if (!pageParam) {
    const { data, error } = await supabaseAdmin
      .from("indicacoes")
      .select(CAMPOS)
      .eq("consultor_id", consultorId)
      .order("criado_em", { ascending: false })
      .limit(500);

    if (error) return NextResponse.json({ error: "Erro ao buscar leads" }, { status: 500 });
    return NextResponse.json(data ?? []);
  }

  // Modo paginado
  const page = Math.max(1, parseInt(pageParam, 10) || 1);
  const limitRaw = parseInt(searchParams.get("limit") ?? "20", 10);
  const limit = Math.min(50, Math.max(1, limitRaw));
  const status = searchParams.get("status") ?? "";
  const busca = (searchParams.get("busca") ?? "").trim();
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from("indicacoes")
    .select(CAMPOS, { count: "exact" })
    .eq("consultor_id", consultorId)
    .order("criado_em", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status && status !== "todos") {
    query = query.eq("status", status);
  }

  if (busca) {
    // Escapa caracteres especiais do PostgREST antes de interpolar na expressao .or()
    const buscaSegura = busca.replace(/[%_,.()"'\\]/g, "\\$&").slice(0, 100);
    query = query.or(`placa.ilike.%${buscaSegura}%,nome_lead.ilike.%${buscaSegura}%`);
  }

  const { data, count, error } = await query;

  if (error) return NextResponse.json({ error: "Erro ao buscar leads" }, { status: 500 });

  return NextResponse.json({ leads: data ?? [], total: count ?? 0, page, limit });
}
