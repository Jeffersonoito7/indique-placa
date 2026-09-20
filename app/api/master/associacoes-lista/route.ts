import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { verificarToken } from "@/lib/master-token";

// Retorna lista enxuta de associações com seu consultor_padrao_id para uso em selects
export async function GET(req: NextRequest) {
  if (!verificarToken(req.cookies.get("master_auth")?.value ?? "")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("associacoes")
    .select("id, nome")
    .eq("status", "ativo")
    .order("nome", { ascending: true })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Buscar consultor_padrao_id de cada associação nas configuracoes
  const ids = (data ?? []).map((a) => a.id);
  const { data: configs } = await supabaseAdmin
    .from("configuracoes")
    .select("associacao_id, consultor_padrao_id")
    .in("associacao_id", ids);

  const mapaConfig = Object.fromEntries(
    (configs ?? []).map((c) => [c.associacao_id, c.consultor_padrao_id ?? null])
  );

  const lista = (data ?? []).map((a) => ({
    id: a.id,
    nome: a.nome,
    consultor_padrao_id: mapaConfig[a.id] ?? null,
  }));

  return NextResponse.json(lista);
}
