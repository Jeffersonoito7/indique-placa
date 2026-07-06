import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { enviarOTP } from "@/lib/whatsapp";
import bcrypt from "bcryptjs";
import { z } from "zod";

// OTP em memoria. Limitacao: nao persiste entre reinicializacoes nem funciona em
// ambientes multi-instancia. Para producao de alta escala, usar Upstash Redis.
const otpStore = new Map<string, { codigo: string; expira: number }>();

const schemaEtapa1 = z.object({
  telefone: z.string().min(10).max(20),
});

const schemaEtapa2 = z.object({
  telefone: z.string().min(10).max(20),
  codigo: z.string().length(6),
  novaSenha: z.string().min(6).max(128),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisicao invalida" }, { status: 400 }); }

  // Etapa 2: validar OTP + trocar senha
  const etapa2 = schemaEtapa2.safeParse(body);
  if (etapa2.success) {
    const tel = etapa2.data.telefone.replace(/\D/g, "");
    const entrada = otpStore.get(tel);

    if (!entrada || Date.now() > entrada.expira || entrada.codigo !== etapa2.data.codigo) {
      return NextResponse.json({ error: "Codigo invalido ou expirado" }, { status: 400 });
    }

    const { data: indicador } = await supabaseAdmin
      .from("indicadores")
      .select("id")
      .eq("telefone", tel)
      .single();

    if (!indicador) {
      otpStore.delete(tel);
      return NextResponse.json({ error: "Conta nao encontrada" }, { status: 404 });
    }

    const hash = await bcrypt.hash(etapa2.data.novaSenha, 10);
    await supabaseAdmin.from("indicadores").update({ senha: hash }).eq("id", indicador.id);
    otpStore.delete(tel);

    return NextResponse.json({ ok: true });
  }

  // Etapa 1: solicitar OTP
  const etapa1 = schemaEtapa1.safeParse(body);
  if (!etapa1.success) return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });

  const tel = etapa1.data.telefone.replace(/\D/g, "");

  // Sempre retorna ok para nao enumerar usuarios
  const { data: indicador } = await supabaseAdmin
    .from("indicadores")
    .select("telefone")
    .eq("telefone", tel)
    .single();

  if (indicador) {
    const codigo = String(Math.floor(100000 + Math.random() * 900000));
    otpStore.set(tel, { codigo, expira: Date.now() + 10 * 60 * 1000 });
    enviarOTP({ telefone: tel, codigo, tipo: "indicador" }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
