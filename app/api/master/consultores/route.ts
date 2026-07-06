import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { verificarToken } from "@/lib/master-token";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("master_auth")?.value ?? "";
  if (!verificarToken(token)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { data } = await supabaseAdmin
    .from("consultores")
    .select("id, nome, fone, email, cidade, associacao, status, created_at")
    .order("created_at", { ascending: false });

  return NextResponse.json({ lista: data ?? [] });
}
