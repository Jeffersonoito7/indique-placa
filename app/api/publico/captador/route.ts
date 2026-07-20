import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  nome: z.string().min(2).max(100),
  telefone: z.string().min(10).max(20),
  senha: z.string().min(6).max(128).optional(),
  consultor_id: z.string().uuid().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const { allowed: rlAllowed } = rateLimit(`captador:${ip}`, 3, 60 * 1000);
  if (!rlAllowed) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde 1 minuto." }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisicao invalida" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });

  const { nome, telefone, consultor_id } = parsed.data;
  const tel = telefone.replace(/\D/g, "");

  // Verificar se consultor existe antes de vincular
  let cid = consultor_id ?? null;
  if (cid) {
    const { data } = await supabaseAdmin.from("consultores").select("id, status").eq("id", cid).single();
    if (!data || data.status !== "ativo") cid = null;
  }

  // Senha: usa a fornecida ou gera uma temporaria de 8 chars alfanumericos
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const senhaPlain = parsed.data.senha ?? Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const senhaHash = await bcrypt.hash(senhaPlain, 10);

  const { error } = await supabaseAdmin.from("indicadores").insert({
    nome,
    telefone: tel,
    senha: senhaHash,
    consultor_id: cid,
  });

  if (error) return NextResponse.json({ error: "Erro ao salvar cadastro" }, { status: 500 });

  // Retorna senha temporaria apenas se nao foi fornecida pelo chamador
  const resposta: Record<string, unknown> = { ok: true };
  if (!parsed.data.senha) resposta.senha_temporaria = senhaPlain;

  return NextResponse.json(resposta);
}
