import { NextRequest, NextResponse } from "next/server";

// Validacao leve para consultor/indicador: checa formato e expiracao do payload.
// Nao valida HMAC (crypto.subtle nao esta disponivel em todas as regioes de borda
// com o plano atual). A validacao completa ocorre em cada API route via validarSessao.
function validarTokenLeve(token: string): boolean {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return false;
    const b64 = token.slice(0, dot);
    const payload = JSON.parse(Buffer.from(b64, "base64url").toString("utf8"));
    if (typeof payload.expira !== "number") return false;
    if (Date.now() > payload.expira) return false;
    return true;
  } catch {
    return false;
  }
}

async function verificarTokenMaster(token: string): Promise<boolean> {
  try {
    const secret = process.env.MASTER_TOKEN_SECRET ?? "fallback-insecure-dev-secret";
    const decoded = atob(token.replace(/-/g, "+").replace(/_/g, "/"));
    const lastColon = decoded.lastIndexOf(":");
    const payload = decoded.slice(0, lastColon);
    const macHex = decoded.slice(lastColon + 1);
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]
    );
    const macBytes = new Uint8Array(macHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
    return await crypto.subtle.verify("HMAC", key, macBytes, enc.encode(payload));
  } catch {
    return false;
  }
}

function subdominio(req: NextRequest): "master" | "consultor" | "indicador" | null {
  const host = req.headers.get("host") ?? "";
  if (host.startsWith("master.")) return "master";
  if (host.startsWith("app.")) return "consultor";
  if (host.startsWith("indicador.")) return "indicador";
  return null;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const painel = subdominio(req);

  // Roteamento por subdominio: redireciona raiz para o painel correto
  if (painel) {
    const raiz = pathname === "/" || pathname === "";
    if (painel === "master" && raiz) {
      return NextResponse.redirect(new URL("/master/login", req.url));
    }
    if (painel === "consultor" && raiz) {
      return NextResponse.redirect(new URL("/consultor/login", req.url));
    }
    if (painel === "indicador" && raiz) {
      return NextResponse.redirect(new URL("/indicador/login", req.url));
    }
  }

  // Protecao de rotas autenticadas
  if (pathname.startsWith("/master") && pathname !== "/master/login") {
    const token = req.cookies.get("master_auth")?.value;
    if (!token || !(await verificarTokenMaster(token))) {
      return NextResponse.redirect(new URL("/master/login", req.url));
    }
  }

  const ROTAS_PUBLICAS_CONSULTOR = ["/consultor/login", "/consultor/cadastro", "/consultor/recuperar-senha"];
  if (pathname.startsWith("/consultor") && !ROTAS_PUBLICAS_CONSULTOR.includes(pathname)) {
    const auth = req.cookies.get("consultor_auth")?.value;
    if (!auth || !validarTokenLeve(auth)) {
      return NextResponse.redirect(new URL("/consultor/login", req.url));
    }
  }

  const ROTAS_PUBLICAS_INDICADOR = ["/indicador/login", "/indicador/cadastro", "/indicador/recuperar-senha"];
  if (pathname.startsWith("/indicador") && !ROTAS_PUBLICAS_INDICADOR.includes(pathname)) {
    const auth = req.cookies.get("indicador_auth")?.value;
    if (!auth || !validarTokenLeve(auth)) {
      return NextResponse.redirect(new URL("/indicador/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/master/:path*", "/consultor/:path*", "/indicador/:path*"],
};
