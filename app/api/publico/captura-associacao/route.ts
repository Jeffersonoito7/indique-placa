import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import bcrypt from "bcryptjs";

async function notificarMasterNovaAssociacao(nome: string, email: string, cidade: string, estado: string) {
  const fone = process.env.MASTER_FONE;
  const baseUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE;
  if (!fone || !baseUrl || !apiKey || !instance) return;

  const numero = fone.replace(/\D/g, "");
  const msg = `*Nova associacao cadastrada!*\n\nNome: ${nome}\nEmail: ${email}\nCidade: ${cidade}/${estado}\n\nAcesse o painel master para revisar e ativar.`;

  fetch(`${baseUrl}/message/sendText/${instance}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: apiKey },
    body: JSON.stringify({ number: numero.startsWith("55") ? numero : `55${numero}`, text: msg }),
  }).catch(() => {});
}

const schema = z.object({
  nome: z.string().min(2).max(120),
  email: z.string().email().max(200),
  fone: z.string().min(10).max(20),
  estado: z.string().length(2),
  cidade: z.string().min(2).max(100),
  senha: z.string().min(6).max(128),
});

function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const { allowed } = await rateLimit(`captura-associacao:${ip}`, 3, 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde 1 minuto." }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Preencha todos os campos corretamente." }, { status: 400 });
  }

  const { nome, email, fone, estado, cidade, senha } = parsed.data;

  const { data: emailExistente } = await supabaseAdmin
    .from("associacoes")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (emailExistente) {
    return NextResponse.json({ error: "Este e-mail já está cadastrado." }, { status: 409 });
  }

  // Gera slug unico
  let slug = gerarSlug(nome);
  const { data: slugExistente } = await supabaseAdmin
    .from("associacoes")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (slugExistente) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const senha_hash = await bcrypt.hash(senha, 10);

  const { error } = await supabaseAdmin
    .from("associacoes")
    .insert({
      nome: nome.trim(),
      slug,
      email: email.toLowerCase().trim(),
      fone: fone.replace(/\D/g, ""),
      estado,
      cidade: cidade.trim(),
      senha_hash,
      status: "inativo",
      plano: "trial",
    });

  if (error) {
    console.error("[captura-associacao] insert error:", error.message);
    return NextResponse.json({ error: "Erro ao criar cadastro. Tente novamente." }, { status: 500 });
  }

  notificarMasterNovaAssociacao(nome.trim(), email.toLowerCase(), cidade.trim(), estado);

  return NextResponse.json({ ok: true });
}
