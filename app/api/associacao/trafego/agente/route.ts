import { NextRequest, NextResponse } from "next/server";
import { autenticarTrafego } from "@/lib/trafego-auth";
import { gerarCopyVariacoes } from "@/lib/trafego-agente";
import { z } from "zod";

const schema = z.object({
  tipo_veiculo: z.string().default("carro"),
  localizacao: z.string().optional(),
  diferencial: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const id = await autenticarTrafego("associacao");
  if (!id) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Agente IA nao configurado" }, { status: 503 });
  }

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Dados invalidos" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });

  try {
    const variacoes = await gerarCopyVariacoes(parsed.data);
    return NextResponse.json({ variacoes });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao gerar copy" }, { status: 500 });
  }
}
