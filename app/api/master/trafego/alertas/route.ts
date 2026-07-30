import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { autenticarTrafego } from "@/lib/trafego-auth";

const TIPO = "master";
const UID = "master";

export async function GET(req: NextRequest) {
  const id = await autenticarTrafego(TIPO);
  if (!id) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const { data } = await supabaseAdmin
    .from("trafego_alertas")
    .select("*, trafego_campanhas(nome)")
    .eq("usuario_id", UID)
    .eq("usuario_tipo", TIPO)
    .order("criado_em", { ascending: false })
    .limit(50);

  return NextResponse.json({ alertas: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const id = await autenticarTrafego(TIPO);
  if (!id) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  await supabaseAdmin
    .from("trafego_alertas")
    .update({ lido: true })
    .eq("usuario_id", UID)
    .eq("usuario_tipo", TIPO)
    .eq("lido", false);

  return NextResponse.json({ ok: true });
}
