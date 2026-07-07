import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { verificarToken } from "@/lib/master-token";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.cookies.get("master_auth")?.value ?? "";
  if (!verificarToken(token)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  // Verificar se tem indicacoes vinculadas
  const { count } = await supabaseAdmin
    .from("indicacoes")
    .select("id", { count: "exact", head: true })
    .eq("indicador_id", id);

  if (count && count > 0) {
    return NextResponse.json(
      { error: `Este indicador possui ${count} indicação(ões) vinculada(s). Exclua as indicações antes.` },
      { status: 409 }
    );
  }

  const { error } = await supabaseAdmin.from("indicadores").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
