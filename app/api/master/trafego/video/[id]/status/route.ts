import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { autenticarTrafego } from "@/lib/trafego-auth";
import { checarStatusVideo } from "@/lib/meta-api";

const TIPO = "master";
const UID = "master";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = await autenticarTrafego(TIPO);
  if (!id) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const { id: video_id } = await params;
  if (!video_id) return NextResponse.json({ error: "ID do video ausente" }, { status: 400 });

  const { data: conta } = await supabaseAdmin
    .from("trafego_contas")
    .select("meta_access_token")
    .eq("usuario_id", UID)
    .eq("usuario_tipo", TIPO)
    .eq("ativo", true)
    .maybeSingle();

  if (!conta) return NextResponse.json({ error: "Conta Meta nao conectada" }, { status: 422 });

  try {
    const status = await checarStatusVideo(conta.meta_access_token, video_id);
    return NextResponse.json(status);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao verificar status" }, { status: 502 });
  }
}
