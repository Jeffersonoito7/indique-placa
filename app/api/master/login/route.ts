import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createHmac } from "crypto";
import { gerarToken } from "@/lib/master-token";
import { rateLimit } from "@/lib/rate-limit";

// Comparacao em tempo constante sem vazamento de tamanho via HMAC
function safeEquals(a: string, b: string): boolean {
  const key = "compare";
  const ha = createHmac("sha256", key).update(a).digest();
  const hb = createHmac("sha256", key).update(b).digest();
  let diff = 0;
  for (let i = 0; i < ha.length; i++) diff |= ha[i] ^ hb[i];
  return diff === 0;
}

const schema = z.object({
  usuario: z.string().min(1).max(64),
  senha: z.string().min(1).max(128),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const { allowed: rlAllowed } = await rateLimit(`master-login:${ip}`, 10, 15 * 60 * 1000);
  if (!rlAllowed) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde 15 minutos." }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisicao invalida" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });

  const { usuario, senha } = parsed.data;

  const usuarioEnv = process.env.MASTER_USUARIO;
  const senhaEnv = process.env.MASTER_SENHA;

  if (!usuarioEnv || !senhaEnv) {
    return NextResponse.json({ error: "Configuração do servidor incompleta" }, { status: 500 });
  }

  // Comparacao em tempo constante — ambas avaliadas antes de checar resultado
  const usuarioOk = safeEquals(usuario, usuarioEnv);
  const senhaOk = safeEquals(senha, senhaEnv);

  if (!usuarioOk || !senhaOk) {
    return NextResponse.json({ error: "Usuario ou senha incorretos" }, { status: 401 });
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
