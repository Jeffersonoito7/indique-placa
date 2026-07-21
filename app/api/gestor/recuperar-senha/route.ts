import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { enviarEmailOTP } from "@/lib/email";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { z } from "zod";

const otpStore = new Map<string, { codigo: string; expira: number }>();

const schemaEtapa1 = z.object({ email: z.string().email() });
const schemaEtapa2 = z.object({
  email: z.string().email(),
  codigo: z.string().length(6),
  novaSenha: z.string().min(6).max(128),
});

export async function POST(req: NextRequest) {
  const { allowed, retryAfter } = rateLimit(getRateLimitKey(req, "gestor-recuperar-senha"), 5, 15 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde 15 minutos." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  // Etapa 2: validar codigo e redefinir senha
  const etapa2 = schemaEtapa2.safeParse(body);
  if (etapa2.success) {
    const { email, codigo, novaSenha } = etapa2.data;
    const emailNorm = email.toLowerCase();
    const entrada = otpStore.get(emailNorm);

    if (!entrada || Date.now() > entrada.expira || entrada.codigo !== codigo) {
      return NextResponse.json({ error: "Código inválido ou expirado" }, { status: 400 });
    }

    const { data: gestor } = await supabaseAdmin
      .from("gestores")
      .select("id")
      .eq("email", emailNorm)
      .single();

    if (!gestor) {
      otpStore.delete(emailNorm);
      return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });
    }

    const hash = await bcrypt.hash(novaSenha, 10);
    await supabaseAdmin.from("gestores").update({ senha_hash: hash }).eq("id", gestor.id);
    otpStore.delete(emailNorm);
    return NextResponse.json({ ok: true });
  }

  // Etapa 1: enviar codigo por email
  const etapa1 = schemaEtapa1.safeParse(body);
  if (!etapa1.success) return NextResponse.json({ error: "Email inválido" }, { status: 400 });

  const { email } = etapa1.data;
  const emailNorm = email.toLowerCase();

  const { data: gestor } = await supabaseAdmin
    .from("gestores")
    .select("nome, email")
    .eq("email", emailNorm)
    .single();

  // Sempre retorna ok para nao revelar se o email existe
  if (gestor) {
    const codigo = String(Math.floor(100000 + Math.random() * 900000));
    otpStore.set(emailNorm, { codigo, expira: Date.now() + 10 * 60 * 1000 });
    await enviarEmailOTP({ email: emailNorm, codigo, nome: gestor.nome });
  }

  return NextResponse.json({ ok: true });
}
