import { NextRequest, NextResponse } from "next/server";
import { getGestorLogado } from "@/lib/auth";

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
  const gestor = await getGestorLogado();
  if (!gestor) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

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
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.id",
      },
      body: JSON.stringify({ textQuery: `${tipo} em ${cidade}`, languageCode: "pt-BR" }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[buscar-parceiros] Google Places erro:", text);
      return NextResponse.json({ error: "Erro ao consultar Google Places" }, { status: 502 });
    }

    const data = await res.json() as {
      places?: Array<{
        id?: string;
        displayName?: { text?: string };
        formattedAddress?: string;
        nationalPhoneNumber?: string;
        rating?: number;
        userRatingCount?: number;
      }>;
    };

    const resultados: Parceiro[] = (data.places ?? []).map((r) => ({
      nome: r.displayName?.text ?? "",
      endereco: r.formattedAddress ?? "",
      telefone: r.nationalPhoneNumber ?? "",
      rating: r.rating ?? null,
      total_avaliacoes: r.userRatingCount ?? 0,
      place_id: r.id ?? "",
    }));

    return NextResponse.json({ resultados, total: resultados.length });
  } catch (err) {
    console.error("[buscar-parceiros] Erro:", err);
    return NextResponse.json({ error: "Erro interno ao buscar parceiros" }, { status: 500 });
  }
}
