import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { autenticarTrafego } from "@/lib/trafego-auth";
import { gerarCopyVariacoes } from "@/lib/trafego-agente";
import { z } from "zod";

const TIPO = "master";
const UID = "master";

const schema = z.object({
  tipo_veiculo: z.string().default("carro"),
  localizacao: z.string().optional(),
  diferencial: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const id = await autenticarTrafego(TIPO);
  if (!id) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const { data: conta } = await supabaseAdmin
    .from("trafego_contas")
    .select("openai_api_key")
    .eq("usuario_id", UID)
    .eq("usuario_tipo", TIPO)
    .maybeSingle();

  if (!conta?.openai_api_key) {
    return NextResponse.json({ error: "Chave OpenAI nao configurada. Adicione sua chave em Conta Meta." }, { status: 422 });
  }

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Dados invalidos" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });

  try {
    const variacoes = await gerarCopyVariacoes({ ...parsed.data, openai_api_key: conta.openai_api_key });
    return NextResponse.json({ variacoes });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao gerar copy" }, { status: 500 });
  }
}
