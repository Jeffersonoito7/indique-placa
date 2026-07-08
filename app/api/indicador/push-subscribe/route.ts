import { NextRequest, NextResponse } from "next/server";
import { getIndicadorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const indicador = await getIndicadorLogado();
  if (!indicador) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requisicao invalida" }, { status: 400 });
  }

  const { subscription } = body as { subscription: unknown };
  if (!subscription || typeof subscription !== "object") {
    return NextResponse.json({ error: "Subscription invalida" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("push_subscriptions").upsert(
    {
      indicador_id: indicador.id,
      subscription,
    },
    { onConflict: "indicador_id" }
  );

  if (error) {
    return NextResponse.json({ error: "Erro ao salvar subscription" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
