import { NextRequest, NextResponse } from "next/server";

// Edge Runtime — sem Buffer, sem Node.js crypto. Usa Web Crypto API.

function base64urlToString(str: string): string {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return atob(padded);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacSha256Hex(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return bytesToHex(new Uint8Array(sig));
}

async function checkMasterCookie(token: string): Promise<boolean> {
  try {
    const secret = process.env.MASTER_TOKEN_SECRET;
    if (!secret) return false;
    const decoded = base64urlToString(token);
    const lastColon = decoded.lastIndexOf(":");
    const payload = decoded.slice(0, lastColon);
    const mac = decoded.slice(lastColon + 1);
    const expected = await hmacSha256Hex(payload, secret);
    if (!timingSafeEqual(mac, expected)) return false;
    const expira = parseInt(payload.split(":").at(-1) ?? "0", 10);
    return !isNaN(expira) && Date.now() <= expira;
  } catch {
    return false;
  }
}

async function checkSessionCookie(token: string, tipo: string): Promise<boolean> {
  try {
    const secret =
      process.env.SESSION_SECRET ??
      (process.env.NODE_ENV !== "production" ? "indique-placa-secret-dev-only" : null);
    if (!secret) return false;
    const dot = token.lastIndexOf(".");
    if (dot === -1) return false;
    const b64 = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expected = await hmacSha256Hex(b64, secret);
    if (!timingSafeEqual(sig, expected)) return false;
    const payloadStr = base64urlToString(b64);
    const payload = JSON.parse(payloadStr) as { tipo?: string; expira?: number };
    if (payload.tipo !== tipo) return false;
    return typeof payload.expira === "number" && Date.now() <= payload.expira;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/master") &&
    !pathname.startsWith("/master/login")
  ) {
    const token = req.cookies.get("master_auth")?.value ?? "";
    if (!token || !(await checkMasterCookie(token))) {
      return NextResponse.redirect(new URL("/master/login", req.url));
    }
  }

  if (
    pathname.startsWith("/gestor") &&
    !pathname.startsWith("/gestor/login") &&
    !pathname.startsWith("/gestor/recuperar-senha")
  ) {
    const token = req.cookies.get("gestor_auth")?.value ?? "";
    if (!token || !(await checkSessionCookie(token, "gestor"))) {
      return NextResponse.redirect(new URL("/gestor/login", req.url));
    }
  }

  if (
    pathname.startsWith("/consultor") &&
    !pathname.startsWith("/consultor/login") &&
    !pathname.startsWith("/consultor/cadastro") &&
    !pathname.startsWith("/consultor/recuperar-senha")
  ) {
    const token = req.cookies.get("consultor_auth")?.value ?? "";
    if (!token || !(await checkSessionCookie(token, "consultor"))) {
      return NextResponse.redirect(new URL("/consultor/login", req.url));
    }
  }

  if (
    pathname.startsWith("/indicador") &&
    !pathname.startsWith("/indicador/login") &&
    !pathname.startsWith("/indicador/cadastro") &&
    !pathname.startsWith("/indicador/recuperar-senha")
  ) {
    const token = req.cookies.get("indicador_auth")?.value ?? "";
    if (!token || !(await checkSessionCookie(token, "indicador"))) {
      return NextResponse.redirect(new URL("/indicador/login", req.url));
    }
  }

  if (
    pathname.startsWith("/associacao") &&
    !pathname.startsWith("/associacao/login") &&
    !pathname.startsWith("/associacao/recuperar-senha")
  ) {
    const token = req.cookies.get("associacao_auth")?.value ?? "";
    if (!token || !(await checkSessionCookie(token, "associacao"))) {
      return NextResponse.redirect(new URL("/associacao/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/master/:path*",
    "/gestor/:path*",
    "/consultor/:path*",
    "/indicador/:path*",
    "/associacao/:path*",
  ],
};
