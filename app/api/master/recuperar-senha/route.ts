import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac } from "crypto";
import { gerarToken } from "@/lib/master-token";
import { criarOTP, validarOTP } from "@/lib/otp";
import { enviarEmailOTP } from "@/lib/email";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { z } from "zod";

function safeEquals(a: string, b: string): boolean {
  const key = "compare";
  const ha = createHmac("sha256", key).update(a).digest();
  const hb = createHmac("sha256", key).update(b).digest();
  let diff = 0;
  for (let i = 0; i < ha.length; i++) diff |= ha[i] ^ hb[i];
  return diff === 0;
}

const schemaEtapa1 = z.object({ usuario: z.string().min(1).max(64) });
const schemaEtapa2 = z.object({
  usuario: z.string().min(1).max(64),
  codigo: z.string().length(6),
});

export async function POST(req: NextRequest) {
  const { allowed, retryAfter } = await rateLimit(getRateLimitKey(req, "master-recuperar-senha"), 5, 15 * 60 * 1000);
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

  const usuarioEnv = process.env.MASTER_USUARIO ?? "";
  const masterEmail = process.env.MASTER_EMAIL ?? "";

  if (!usuarioEnv || !masterEmail) {
    return NextResponse.json({ error: "Configuração do servidor incompleta" }, { status: 500 });
  }

  // Etapa 2: valida OTP e cria sessão
  const etapa2 = schemaEtapa2.safeParse(body);
  if (etapa2.success) {
    const { usuario, codigo } = etapa2.data;
    if (!safeEquals(usuario, usuarioEnv)) {
      return NextResponse.json({ error: "Usuário inválido" }, { status: 401 });
    }

    const valido = await validarOTP(masterEmail, "master", codigo);
    if (!valido) {
      return NextResponse.json({ error: "Código inválido ou expirado" }, { status: 400 });
    }

    const token = gerarToken(usuario);
    const cookieStore = await cookies();
    cookieStore.set("master_auth", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 8,
      path: "/",
    });

    return NextResponse.json({ ok: true });
  }

  // Etapa 1: verifica usuario e envia OTP
  const etapa1 = schemaEtapa1.safeParse(body);
  if (!etapa1.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { usuario } = etapa1.data;

  // Responde ok=true mesmo se usuario errado (sem vazar informacao)
  if (!safeEquals(usuario, usuarioEnv)) {
    return NextResponse.json({ ok: true });
  }

  const codigo = await criarOTP(masterEmail, "master");
  await enviarEmailOTP({ email: masterEmail, codigo, nome: "Administrador" });

  return NextResponse.json({ ok: true });
}
