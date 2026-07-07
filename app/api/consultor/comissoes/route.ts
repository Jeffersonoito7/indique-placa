import { NextRequest, NextResponse } from "next/server";
import { getConsultorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { z } from "zod";

const DEFAULTS = [
  { tipo: "moto", label: "Moto", icone: "moto", comissao_indicador: 50, ativo: true },
  { tipo: "carro", label: "Carro", icone: "carro", comissao_indicador: 100, ativo: true },
  { tipo: "caminhao", label: "Caminhao", icone: "caminhao", comissao_indicador: 500, ativo: true },
];

export async function GET() {
  const consultor = await getConsultorLogado();
  if (!consultor) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const { data } = await supabaseAdmin
    .from("comissoes_tipos")
    .select("tipo, label, icone, comissao_indicador, ativo")
    .eq("consultor_id", consultor.id);

  if (!data || data.length === 0) return NextResponse.json(DEFAULTS);

  // Mescla defaults com o que existe para garantir os 3 tipos
  const mapa = new Map(data.map((d) => [d.tipo, d]));
  const resultado = DEFAULTS.map((d) => mapa.get(d.tipo) ?? d);
  return NextResponse.json(resultado);
}

const schemaPost = z.object({
  tipo: z.enum(["moto", "carro", "caminhao"]),
  label: z.string().min(1).max(50),
  icone: z.string().min(1).max(50),
  comissao_indicador: z.number().min(0),
  ativo: z.boolean().optional().default(true),
});

export async function POST(req: NextRequest) {
  const consultor = await getConsultorLogado();
  if (!consultor) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisicao invalida" }, { status: 400 }); }

  const parsed = schemaPost.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });

  const { tipo, label, icone, comissao_indicador, ativo } = parsed.data;

  const { error } = await supabaseAdmin
    .from("comissoes_tipos")
    .upsert(
      { consultor_id: consultor.id, tipo, label, icone, comissao_indicador, ativo },
      { onConflict: "consultor_id,tipo" }
    );

  if (error) return NextResponse.json({ error: "Erro ao salvar comissao" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
