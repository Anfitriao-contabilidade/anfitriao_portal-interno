import { NextResponse, type NextRequest } from "next/server";

/** Nome do cookie de sessão (duplicado de lib/session.ts porque o middleware roda no Edge, sem "server-only"). */
export const SESSION_COOKIE = "anf_sessao";

/** Rotas acessíveis sem sessão. Tudo o que não estiver aqui exige login. */
const PUBLIC_PATHS = ["/login", "/cadastro", "/recuperar-senha", "/redefinir-senha", "/auth/", "/privacidade"];
/** Rotas de visitante — quem já tem sessão é mandado para a Home. */
const GUEST_ONLY = ["/login", "/cadastro", "/recuperar-senha"];

function matches(pathname: string, list: string[]) {
  return list.some((p) => (p.endsWith("/") ? pathname.startsWith(p) : pathname === p || pathname.startsWith(p + "/")));
}

/**
 * Primeiro portão, só pela PRESENÇA do cookie de sessão (sem chamada de rede
 * por requisição). A validação de verdade é feita pela API em cada chamada
 * (assinatura, expiração e revogação do cookie de sessão do Firebase) —
 * sessão inválida leva a /auth/sessao-expirada, que apaga o cookie.
 */
export function controleDeAcesso(request: NextRequest, requestHeaders: Headers) {
  const temSessao = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  const { pathname, search } = request.nextUrl;

  if (!temSessao && !matches(pathname, PUBLIC_PATHS)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    if (pathname !== "/") loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  if (temSessao && matches(pathname, GUEST_ONLY)) {
    const home = request.nextUrl.clone();
    home.pathname = "/";
    home.search = "";
    return NextResponse.redirect(home);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}
