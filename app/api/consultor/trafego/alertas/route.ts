import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { autenticarTrafego } from "@/lib/trafego-auth";

export async function GET(req: NextRequest) {
  const id = await autenticarTrafego("consultor");
  if (!id) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const { data } = await supabaseAdmin
    .from("trafego_alertas")
    .select("*, trafego_campanhas(nome)")
    .eq("usuario_id", id)
    .eq("usuario_tipo", "consultor")
    .order("criado_em", { ascending: false })
    .limit(50);

  return NextResponse.json({ alertas: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const id = await autenticarTrafego("consultor");
  if (!id) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  // Marca todos como lidos
  await supabaseAdmin
    .from("trafego_alertas")
    .update({ lido: true })
    .eq("usuario_id", id)
    .eq("usuario_tipo", "consultor")
    .eq("lido", false);

  return NextResponse.json({ ok: true });
}
