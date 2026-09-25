import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/security/rotas";

/**
 * A API recusou a sessão (expirada, revogada, conta desativada): apaga o
 * cookie local e volta ao login. Rota GET porque é alvo de redirect() a partir
 * de Server Components — só remove o cookie deste navegador (não revoga nada
 * na API), então não há o que um atacante ganhe forçando a visita.
 */
export function GET(request: NextRequest) {
  const url = new URL("/login?expirou=1", request.nextUrl.origin);
  const resp = NextResponse.redirect(url);
  resp.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return resp;
}
