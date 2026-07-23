import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// Cache de 5 minutos — evita query no banco a cada page load
export const revalidate = 300;

export async function GET() {
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const { count: placasMes } = await supabaseAdmin
    .from("indicacoes")
    .select("id", { count: "exact", head: true })
    .gte("criado_em", inicioMes.toISOString());

  const { count: totalConsultores } = await supabaseAdmin
    .from("consultores")
    .select("id", { count: "exact", head: true })
    .eq("status", "ativo");

  return NextResponse.json({
    placas_mes: placasMes ?? 0,
    consultores_ativos: totalConsultores ?? 0,
  });
}
