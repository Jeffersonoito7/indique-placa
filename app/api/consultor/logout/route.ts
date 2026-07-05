import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revogarSessao } from "@/lib/sessoes";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("consultor_auth")?.value;
  if (token) await revogarSessao(token);
  cookieStore.delete("consultor_auth");
  return NextResponse.json({ ok: true });
}
