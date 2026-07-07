import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";
import { validarSessao } from "@/lib/sessoes";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("consultor_auth")?.value;
  if (!token) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const consultorId = await validarSessao(token, "consultor");
  if (!consultorId) return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("indicacoes")
    .select("id, placa, nome_lead, telefone_lead, status, criado_em, tipo_veiculo, pago_em, comprovante_url, valor_pago, indicadores(nome, chave_pix)")
    .eq("consultor_id", consultorId)
    .order("criado_em", { ascending: false });

  if (error) return NextResponse.json({ error: "Erro ao buscar leads" }, { status: 500 });

  return NextResponse.json(data ?? []);
}
