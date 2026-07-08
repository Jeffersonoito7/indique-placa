import { NextRequest, NextResponse } from "next/server";
import { getConsultorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const consultor = await getConsultorLogado();
  if (!consultor) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

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
      consultor_id: consultor.id,
      subscription,
    },
    { onConflict: "consultor_id" }
  );

  if (error) {
    return NextResponse.json({ error: "Erro ao salvar subscription" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
