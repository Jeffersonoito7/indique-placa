import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { verificarToken } from "@/lib/master-token";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("master_auth")?.value ?? "";
  if (!verificarToken(token)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { data } = await supabaseAdmin
    .from("indicadores")
    .select("id, nome, telefone, criado_em, consultores(nome)")
    .order("criado_em", { ascending: false });

  return NextResponse.json(data ?? []);
}
