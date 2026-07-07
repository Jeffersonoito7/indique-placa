import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";
import { validarSessao } from "@/lib/sessoes";

const BUCKET = "comprovantes";
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("consultor_auth")?.value;
  if (!token) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const consultorId = await validarSessao(token, "consultor");
  if (!consultorId) return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });

  const { id } = await params;

  // Verificar se o lead pertence ao consultor e está fechado
  const { data: lead } = await supabaseAdmin
    .from("indicacoes")
    .select("id, consultor_id, indicador_id, status")
    .eq("id", id)
    .single();

  if (!lead || lead.consultor_id !== consultorId) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
  }
  if (lead.status !== "fechado") {
    return NextResponse.json({ error: "Só é possível registrar pagamento em leads fechados" }, { status: 400 });
  }
  if (!lead.indicador_id) {
    return NextResponse.json({ error: "Este lead não tem indicador vinculado" }, { status: 400 });
  }

  let formData: FormData;
  try { formData = await req.formData(); } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const valor = Number(formData.get("valor") ?? 0);
  const arquivo = formData.get("comprovante");

  if (!(arquivo instanceof File)) {
    return NextResponse.json({ error: "Comprovante obrigatório" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(arquivo.type)) {
    return NextResponse.json({ error: "Formato inválido. Use JPG, PNG, WebP ou PDF." }, { status: 400 });
  }
  if (arquivo.size > MAX_SIZE) {
    return NextResponse.json({ error: "Arquivo muito grande. Máximo: 5MB." }, { status: 400 });
  }

  // Garantir bucket existe
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  const bucketExiste = buckets?.some((b) => b.name === BUCKET);
  if (!bucketExiste) {
    await supabaseAdmin.storage.createBucket(BUCKET, { public: false });
  }

  const ext = arquivo.type === "application/pdf" ? "pdf" : arquivo.type.split("/")[1];
  const path = `${consultorId}/${id}_${Date.now()}.${ext}`;
  const buffer = Buffer.from(await arquivo.arrayBuffer());

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: arquivo.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: "Erro ao enviar comprovante" }, { status: 500 });
  }

  const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);

  const { error: updateError } = await supabaseAdmin
    .from("indicacoes")
    .update({
      pago_em: new Date().toISOString(),
      comprovante_url: urlData.publicUrl,
      valor_pago: valor > 0 ? valor : null,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Erro ao registrar pagamento" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, comprovante_url: urlData.publicUrl });
}
