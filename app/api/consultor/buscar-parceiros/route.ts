import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";
import { validarSessao } from "@/lib/sessoes";

type Parceiro = {
  nome: string;
  endereco: string;
  telefone: string;
  rating: number | null;
  total_avaliacoes: number;
  place_id: string;
};

// Dados mock para desenvolvimento sem chave configurada
function mockParceiros(tipo: string, cidade: string): Parceiro[] {
  const nomes = [
    `${tipo} Central de ${cidade}`,
    `${tipo} Express ${cidade}`,
    `${tipo} Rapido - ${cidade}`,
    `${tipo} Top ${cidade}`,
    `${tipo} Prime`,
  ];
  return nomes.map((nome, i) => ({
    nome,
    endereco: `Rua Exemplo, ${100 + i * 50} - ${cidade}`,
    telefone: `(87) 9${9000 + i}-${1000 + i}`,
    rating: 3.5 + i * 0.3,
    total_avaliacoes: 10 + i * 15,
    place_id: `mock_${i}`,
  }));
}

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("consultor_auth")?.value;
  if (!token) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const consultorId = await validarSessao(token, "consultor");
  if (!consultorId) return NextResponse.json({ error: "Sessao expirada" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const cidade = (searchParams.get("cidade") ?? "").trim();
  const tipo = (searchParams.get("tipo") ?? "").trim();

  if (!cidade || !tipo) {
    return NextResponse.json({ error: "Informe cidade e tipo" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  // Sem chave: retorna mock para desenvolvimento
  if (!apiKey) {
    const resultados = mockParceiros(tipo, cidade);
    return NextResponse.json({ resultados, total: resultados.length, mock: true });
  }

  try {
    const query = encodeURIComponent(`${tipo} em ${cidade}`);
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${apiKey}&language=pt-BR`;

    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) {
      return NextResponse.json({ error: "Erro ao consultar Google Places" }, { status: 502 });
    }

    const data = await res.json() as {
      results: Array<{
        name?: string;
        formatted_address?: string;
        formatted_phone_number?: string;
        rating?: number;
        user_ratings_total?: number;
        place_id?: string;
      }>;
      next_page_token?: string;
      status?: string;
    };

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("[buscar-parceiros] Google Places status:", data.status);
      return NextResponse.json({ error: `Google Places: ${data.status}` }, { status: 502 });
    }

    const resultados: Parceiro[] = (data.results ?? []).map((r) => ({
      nome: r.name ?? "",
      endereco: r.formatted_address ?? "",
      telefone: r.formatted_phone_number ?? "",
      rating: r.rating ?? null,
      total_avaliacoes: r.user_ratings_total ?? 0,
      place_id: r.place_id ?? "",
    }));

    return NextResponse.json({
      resultados,
      total: resultados.length,
      proximo_token: data.next_page_token ?? null,
    });
  } catch (err) {
    console.error("[buscar-parceiros] Erro:", err);
    return NextResponse.json({ error: "Erro interno ao buscar parceiros" }, { status: 500 });
  }
}
