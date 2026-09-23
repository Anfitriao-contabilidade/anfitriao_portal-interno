import { type NextRequest } from "next/server";
import { controleDeAcesso } from "@/lib/security/rotas";
import { buildCsp } from "@/lib/security/csp";

export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const isHttps =
    request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
  const csp = buildCsp(nonce, process.env.NODE_ENV !== "production", isHttps);

  // O Next.js lê o nonce do cabeçalho da requisição e o aplica aos próprios scripts.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = controleDeAcesso(request, requestHeaders);
  response.headers.set("Content-Security-Policy", csp);
  // Páginas autenticadas nunca devem ficar em cache compartilhado (proxy/CDN).
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)",
  ],
};
