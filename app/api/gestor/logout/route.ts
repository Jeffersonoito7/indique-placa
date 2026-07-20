import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revogarSessao } from "@/lib/sessoes";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("gestor_auth")?.value;
  if (token) await revogarSessao(token);
  cookieStore.delete("gestor_auth");
  return NextResponse.json({ ok: true });
}
