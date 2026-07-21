import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { verificarToken } from "@/lib/master-token";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.cookies.get("master_auth")?.value ?? "";
  if (!verificarToken(token)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  // Soft delete: mantem o registro para preservar integridade referencial com gestores, consultores e indicacoes
  const { error } = await supabaseAdmin
    .from("associacoes")
    .update({ status: "inativo", atualizado_em: new Date().toISOString() })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
