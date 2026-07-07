import { NextRequest, NextResponse } from "next/server";
import { getConsultorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

const BUCKET = "fotos-consultor";
const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  const consultor = await getConsultorLogado();
  if (!consultor) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  let formData: FormData;
  try { formData = await req.formData(); } catch { return NextResponse.json({ error: "Requisicao invalida" }, { status: 400 }); }

  const file = formData.get("foto");
  if (!(file instanceof File)) return NextResponse.json({ error: "Arquivo nao encontrado" }, { status: 400 });

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Tipo de arquivo nao permitido. Use JPG, PNG ou WebP." }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Arquivo muito grande. Tamanho maximo: 2MB." }, { status: 400 });
  }

  // Garantir bucket existe
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  const bucketExiste = buckets?.some((b) => b.name === BUCKET);
  if (!bucketExiste) {
    await supabaseAdmin.storage.createBucket(BUCKET, { public: true });
  }

  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `${consultor.id}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) return NextResponse.json({ error: "Erro ao fazer upload da foto" }, { status: 500 });

  const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
  const url = urlData.publicUrl;

  const { error: updateError } = await supabaseAdmin
    .from("consultores")
    .update({ foto_url: url })
    .eq("id", consultor.id);

  if (updateError) return NextResponse.json({ error: "Erro ao salvar URL da foto" }, { status: 500 });

  return NextResponse.json({ url });
}
