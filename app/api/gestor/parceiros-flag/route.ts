import { NextResponse } from "next/server";
import { getGestorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  const gestor = await getGestorLogado();
  if (!gestor) return NextResponse.json({ habilitado: false });

  const { data } = await supabaseAdmin
    .from("gestores")
    .select("parceiros_habilitado, associacoes(parceiros_habilitado)")
    .eq("id", gestor.id)
    .single();

  const assocFlag = (data?.associacoes as unknown as { parceiros_habilitado: boolean } | null)?.parceiros_habilitado ?? false;
  const habilitado = (data?.parceiros_habilitado ?? false) || assocFlag;

  return NextResponse.json({ habilitado });
}
