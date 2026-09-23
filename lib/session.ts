import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/security/rotas";

export { SESSION_COOKIE };

/**
 * Cookie de sessão do portal. Guarda o *session cookie* do Firebase emitido
 * pela API em POST /auth/login. Só o servidor do Next.js o lê (httpOnly):
 * nenhum JavaScript do navegador tem acesso ao token.
 */
const MAX_AGE_PADRAO = 60 * 60 * 72; // 72 h (mesmo padrão da API)

function opcoes(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const, // bloqueia envio em POST cross-site (CSRF)
    path: "/",
    maxAge,
  };
}

export async function lerSessao(): Promise<string | null> {
  const valor = (await cookies()).get(SESSION_COOKIE)?.value;
  return valor && valor.length <= 4096 ? valor : null;
}

/** Grava a sessão (Server Actions / Route Handlers). */
export async function gravarSessao(sessao: string, expiraEm?: string) {
  const ms = expiraEm ? Date.parse(expiraEm) - Date.now() : NaN;
  const maxAge = Number.isFinite(ms) && ms > 0 ? Math.floor(ms / 1000) : MAX_AGE_PADRAO;
  (await cookies()).set(SESSION_COOKIE, sessao, opcoes(maxAge));
}

export async function apagarSessao() {
  (await cookies()).set(SESSION_COOKIE, "", opcoes(0));
}
