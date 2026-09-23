import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/security/rotas";

/**
 * A API recusou a sessão (expirada, revogada, conta desativada): apaga o
 * cookie local e volta ao login. Rota GET porque é alvo de redirect() a partir
 * de Server Components — só remove o cookie deste navegador (não revoga nada
 * na API), então não há o que um atacante ganhe forçando a visita.
 */
export function GET(request: NextRequest) {
  // #region agent log
  fetch("http://127.0.0.1:7340/ingest/6c2f829b-8f67-4ad5-a7ca-435195fbb921", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "129214" }, body: JSON.stringify({ sessionId: "129214", hypothesisId: "E", location: "sessao-expirada/route.ts", message: "cookie apagado e volta ao login", data: { temCookie: Boolean(request.cookies.get(SESSION_COOKIE)?.value), cookieLen: request.cookies.get(SESSION_COOKIE)?.value?.length ?? 0 }, timestamp: Date.now() }) }).catch(() => {});
  // #endregion
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
