import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { enviarEmailBoasVindas } from "@/lib/email";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  nome: z.string().min(2).max(100),
  email: z.string().email().max(200),
  fone: z.string().min(10).max(20),
  senha: z.string().min(6).max(128),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const { allowed } = await rateLimit(`gestor-cadastro:${ip}`, 3, 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde 1 minuto." }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Preencha todos os campos corretamente" }, { status: 400 });
  }

  const { nome, email, fone, senha } = parsed.data;
  const emailNorm = email.toLowerCase();
  const foneNumeros = fone.replace(/\D/g, "");

  const { data: existente } = await supabaseAdmin
    .from("gestores")
    .select("id")
    .eq("email", emailNorm)
    .single();

  if (existente) {
    return NextResponse.json({ error: "Este e-mail já está cadastrado" }, { status: 409 });
  }

  const senha_hash = await bcrypt.hash(senha, 10);

  const { error } = await supabaseAdmin.from("gestores").insert({
    nome,
    email: emailNorm,
    fone: foneNumeros,
    senha_hash,
    ativo: true,
    plano: "free",
  });

  if (error) {
    console.error("[gestor-cadastro] erro ao inserir:", error.code, error.message);
    return NextResponse.json({ error: "Erro ao salvar cadastro. Tente novamente." }, { status: 500 });
  }

  // Email de boas-vindas nao-bloqueante
  enviarEmailBoasVindas({ email: emailNorm, nome, tipo: "gestor" }).catch(() => {});

  return NextResponse.json({ ok: true });
}
