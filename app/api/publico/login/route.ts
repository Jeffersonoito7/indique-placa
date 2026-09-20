import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";
import { criarSessao } from "@/lib/sessoes";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { z } from "zod";

const DUMMY_HASH = "$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

const schema = z.object({
  email: z.string().email().max(200),
  senha: z.string().min(1).max(128),
});

export async function POST(req: NextRequest) {
  const { allowed, retryAfter } = await rateLimit(getRateLimitKey(req, "login-unificado"), 5, 15 * 60 * 1000);
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

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { email, senha } = parsed.data;
  const emailNorm = email.toLowerCase();

  // Busca em todas as tabelas em paralelo
  const [assocRes, gestorRes, consultorRes, indicadorRes] = await Promise.all([
    supabaseAdmin.from("associacoes").select("id, nome, status, senha_hash").eq("email", emailNorm).maybeSingle(),
    supabaseAdmin.from("gestores").select("id, nome, ativo, senha_hash").eq("email", emailNorm).maybeSingle(),
    supabaseAdmin.from("consultores").select("id, nome, status, senha").eq("email", emailNorm).maybeSingle(),
    supabaseAdmin.from("indicadores").select("id, nome, status, senha").eq("email", emailNorm).maybeSingle(),
  ]);

  // Determina candidato e hash na ordem de precedencia
  type Candidato = {
    perfil: "associacao" | "gestor" | "consultor" | "indicador";
    id: string;
    nome: string;
    hash: string;
    ativo: boolean;
    redirect: string;
    cookie: string;
  };

  let candidato: Candidato | null = null;

  if (assocRes.data) {
    const a = assocRes.data;
    candidato = {
      perfil: "associacao",
      id: a.id,
      nome: a.nome,
      hash: a.senha_hash ?? DUMMY_HASH,
      ativo: a.status !== "inativo" && a.status !== "suspenso",
      redirect: "/associacao/dashboard",
      cookie: "associacao_auth",
    };
  } else if (gestorRes.data) {
    const g = gestorRes.data;
    candidato = {
      perfil: "gestor",
      id: g.id,
      nome: g.nome,
      hash: g.senha_hash ?? DUMMY_HASH,
      ativo: g.ativo === true,
      redirect: "/gestor/dashboard",
      cookie: "gestor_auth",
    };
  } else if (consultorRes.data) {
    const c = consultorRes.data;
    candidato = {
      perfil: "consultor",
      id: c.id,
      nome: c.nome,
      hash: (c.senha as string) ?? DUMMY_HASH,
      ativo: c.status === "ativo",
      redirect: "/consultor/leads",
      cookie: "consultor_auth",
    };
  } else if (indicadorRes.data) {
    const i = indicadorRes.data;
    candidato = {
      perfil: "indicador",
      id: i.id,
      nome: i.nome,
      hash: (i.senha as string) ?? DUMMY_HASH,
      ativo: !i.status || i.status === "ativo",
      redirect: "/indicador/indicar",
      cookie: "indicador_auth",
    };
  }

  // Sempre faz bcrypt (evita timing oracle)
  const hashParaComparar = candidato?.hash ?? DUMMY_HASH;
  const senhaCorreta = await bcrypt.compare(senha, hashParaComparar);

  if (!candidato || !senhaCorreta) {
    return NextResponse.json({ error: "E-mail ou senha incorretos" }, { status: 401 });
  }

  if (!candidato.ativo) {
    return NextResponse.json({ error: "Conta inativa. Entre em contato com o suporte." }, { status: 403 });
  }

  const token = await criarSessao(candidato.id, candidato.perfil);

  const cookieStore = await cookies();
  cookieStore.set(candidato.cookie, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 8,
    path: "/",
  });

  return NextResponse.json({
    ok: true,
    nome: candidato.nome,
    perfil: candidato.perfil,
    redirect: candidato.redirect,
  });
}
