import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { enviarOTP } from "@/lib/whatsapp";
import { criarOTP, validarOTP } from "@/lib/otp";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schemaEtapa1 = z.object({ telefone: z.string().min(10).max(20) });
const schemaEtapa2 = z.object({
  telefone: z.string().min(10).max(20),
  codigo: z.string().length(6),
  novaSenha: z.string().min(6).max(128),
});

export async function POST(req: NextRequest) {
  const { allowed, retryAfter } = await rateLimit(getRateLimitKey(req, "indicador-recuperar-senha"), 5, 15 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde 15 minutos." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisição inválida" }, { status: 400 }); }

  const etapa2 = schemaEtapa2.safeParse(body);
  if (etapa2.success) {
    const { telefone, codigo, novaSenha } = etapa2.data;
    const tel = telefone.replace(/\D/g, "");

    const valido = await validarOTP(tel, "indicador", codigo);
    if (!valido) {
      return NextResponse.json({ error: "Código inválido ou expirado" }, { status: 400 });
    }

    const { data: indicador } = await supabaseAdmin
      .from("indicadores")
      .select("id")
      .eq("telefone", tel)
      .maybeSingle();

    if (!indicador) return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });

    const hash = await bcrypt.hash(novaSenha, 12);
    const { error: errUpdate } = await supabaseAdmin.from("indicadores").update({ senha: hash }).eq("id", indicador.id);
    if (errUpdate) return NextResponse.json({ error: "Erro ao redefinir senha" }, { status: 500 });

    return NextResponse.json({ ok: true });
  }

  const etapa1 = schemaEtapa1.safeParse(body);
  if (!etapa1.success) return NextResponse.json({ error: "Telefone inválido" }, { status: 400 });

  const tel = etapa1.data.telefone.replace(/\D/g, "");

  const { data: indicador } = await supabaseAdmin
    .from("indicadores")
    .select("nome, telefone")
    .eq("telefone", tel)
    .maybeSingle();

  if (!indicador) {
    return NextResponse.json({ ok: true, enviado: false });
  }

  const codigo = await criarOTP(tel, "indicador");
  await enviarOTP({ telefone: tel, codigo, tipo: "indicador" });

  return NextResponse.json({ ok: true, enviado: true });
}
