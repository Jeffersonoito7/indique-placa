import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { autenticarTrafego } from "@/lib/trafego-auth";
import { iniciarUploadVideo } from "@/lib/meta-api";
import { z } from "zod";

const TIPO = "master";
const UID = "master";

const schema = z.object({
  nome: z.string().min(1).max(255),
  tamanho: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const id = await autenticarTrafego(TIPO);
  if (!id) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Dados invalidos" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados invalidos", detalhes: parsed.error.flatten() }, { status: 400 });

  const { data: conta } = await supabaseAdmin
    .from("trafego_contas")
    .select("meta_access_token, meta_ad_account_id")
    .eq("usuario_id", UID)
    .eq("usuario_tipo", TIPO)
    .eq("ativo", true)
    .maybeSingle();

  if (!conta) return NextResponse.json({ error: "Conta Meta nao conectada" }, { status: 422 });

  try {
    const resultado = await iniciarUploadVideo(
      { access_token: conta.meta_access_token, ad_account_id: conta.meta_ad_account_id },
      parsed.data.nome,
      parsed.data.tamanho
    );
    return NextResponse.json(resultado);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao iniciar upload" }, { status: 502 });
  }
}
