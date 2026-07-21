import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { enviarEmailOTP } from "@/lib/email";
import { criarOTP, validarOTP } from "@/lib/otp";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schemaEtapa1 = z.object({ email: z.string().email() });
const schemaEtapa2 = z.object({
  email: z.string().email(),
  codigo: z.string().length(6),
  novaSenha: z.string().min(6).max(128),
});

export async function POST(req: NextRequest) {
  const { allowed, retryAfter } = rateLimit(getRateLimitKey(req, "consultor-recuperar-senha"), 5, 15 * 60 * 1000);
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
    const { email, codigo, novaSenha } = etapa2.data;
    const emailNorm = email.toLowerCase();

    const valido = await validarOTP(emailNorm, "consultor", codigo);
    if (!valido) {
      return NextResponse.json({ error: "Código inválido ou expirado" }, { status: 400 });
    }

    const { data: consultor } = await supabaseAdmin
      .from("consultores")
      .select("id")
      .eq("email", emailNorm)
      .single();

    if (!consultor) return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });

    const hash = await bcrypt.hash(novaSenha, 10);
    await supabaseAdmin.from("consultores").update({ senha_hash: hash }).eq("id", consultor.id);

    return NextResponse.json({ ok: true });
  }

  const etapa1 = schemaEtapa1.safeParse(body);
  if (!etapa1.success) return NextResponse.json({ error: "Email inválido" }, { status: 400 });

  const { email } = etapa1.data;
  const emailNorm = email.toLowerCase();

  const { data: consultor } = await supabaseAdmin
    .from("consultores")
    .select("nome, email")
    .eq("email", emailNorm)
    .single();

  if (consultor) {
    const codigo = await criarOTP(emailNorm, "consultor");
    await enviarEmailOTP({ email: emailNorm, codigo, nome: consultor.nome });
  }

  return NextResponse.json({ ok: true });
}
