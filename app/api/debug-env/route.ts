import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({
    resend_key_exists: !!process.env.RESEND_API_KEY,
    resend_key_prefix: process.env.RESEND_API_KEY?.slice(0, 8) ?? "VAZIO",
  });
}
