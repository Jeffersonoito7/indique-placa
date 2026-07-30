import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { autenticarTrafego } from "@/lib/trafego-auth";
import { transferirChunkVideo } from "@/lib/meta-api";

const TIPO = "master";
const UID = "master";

export async function POST(req: NextRequest) {
  const id = await autenticarTrafego(TIPO);
  if (!id) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Falha ao ler o formulario" }, { status: 400 });
  }

  const chunk = formData.get("chunk");
  const upload_session_id = formData.get("upload_session_id");
  const start_offset_raw = formData.get("start_offset");
  const end_offset_raw = formData.get("end_offset");

  if (!(chunk instanceof Blob) || !upload_session_id || !start_offset_raw || !end_offset_raw) {
    return NextResponse.json({ error: "Campos obrigatorios ausentes: chunk, upload_session_id, start_offset, end_offset" }, { status: 400 });
  }

  const start_offset = parseInt(String(start_offset_raw), 10);
  const end_offset = parseInt(String(end_offset_raw), 10);

  if (isNaN(start_offset) || isNaN(end_offset)) {
    return NextResponse.json({ error: "start_offset e end_offset devem ser numeros inteiros" }, { status: 400 });
  }

  const { data: conta } = await supabaseAdmin
    .from("trafego_contas")
    .select("meta_access_token, meta_ad_account_id")
    .eq("usuario_id", UID)
    .eq("usuario_tipo", TIPO)
    .eq("ativo", true)
    .maybeSingle();

  if (!conta) return NextResponse.json({ error: "Conta Meta nao conectada" }, { status: 422 });

  try {
    const resultado = await transferirChunkVideo(
      { access_token: conta.meta_access_token, ad_account_id: conta.meta_ad_account_id },
      String(upload_session_id),
      start_offset,
      end_offset,
      chunk
    );
    return NextResponse.json(resultado);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao enviar chunk" }, { status: 502 });
  }
}
