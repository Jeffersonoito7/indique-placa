import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { enviarEmailOTP } from "@/lib/email";
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
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisição inválida" }, { status: 400 }); }

  const etapa2 = schemaEtapa2.safeParse(body);
  if (etapa2.success) {
    const { email, codigo, novaSenha } = etapa2.data;
    const entrada = otpStore.get(email);
    if (!entrada || Date.now() > entrada.expira || entrada.codigo !== codigo) {
      return NextResponse.json({ error: "Código inválido ou expirado" }, { status: 400 });
    }
    const { data: consultor } = await supabaseAdmin.from("consultores").select("id").eq("email", email).single();
    if (!consultor) { otpStore.delete(email); return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 }); }
    const hash = await bcrypt.hash(novaSenha, 10);
    await supabaseAdmin.from("consultores").update({ senha: hash }).eq("id", consultor.id);
    otpStore.delete(email);
    return NextResponse.json({ ok: true });
  }

  const etapa1 = schemaEtapa1.safeParse(body);
  if (!etapa1.success) return NextResponse.json({ error: "Email inválido" }, { status: 400 });

  const { email } = etapa1.data;
  const { data: consultor } = await supabaseAdmin.from("consultores").select("nome, email").eq("email", email).single();
  if (consultor) {
    const codigo = String(Math.floor(100000 + Math.random() * 900000));
    otpStore.set(email, { codigo, expira: Date.now() + 10 * 60 * 1000 });
    await enviarEmailOTP({ email, codigo, nome: consultor.nome });
  }
  return NextResponse.json({ ok: true });
}
