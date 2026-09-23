import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { serverEnv } from "@/lib/env";
import { lerSessao } from "@/lib/session";
import { ApiError } from "@/lib/api-error";

export { ApiError };

/**
 * Cliente HTTP da Anfitrião API (FastAPI) — usado SÓ no servidor (Server
 * Components, Server Actions e Route Handlers).
 *
 * - Autentica com o cookie de sessão do Firebase (Authorization: Bearer).
 * - Repassa o IP do usuário final (X-Forwarded-For) junto com o segredo
 *   compartilhado X-Portal-Secret, para o rate limit/auditoria da API
 *   enxergarem o usuário, e não o servidor do portal.
 * - Erros viram ApiError com o código da API (ex.: "cadastro_pendente").
 */

export type Pagina<T> = { items: T[]; total: number; limit: number; offset: number };

type Opcoes = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Sessão explícita (ex.: logo após o login). Padrão: cookie da requisição. */
  sessao?: string | null;
  /** false = chamada pública, sem Authorization. */
  autenticado?: boolean;
};

async function ipDoCliente() {
  try {
    const h = await headers();
    return (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "").trim();
  } catch {
    return "";
  }
}

export async function api<T>(path: string, opts: Opcoes = {}): Promise<T> {
  const env = serverEnv();
  const url = new URL(env.API_URL + path);
  for (const [k, v] of Object.entries(opts.query ?? {})) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }

  const h: Record<string, string> = { Accept: "application/json" };
  if (opts.body !== undefined) h["Content-Type"] = "application/json";
  if (opts.autenticado !== false) {
    const sessao = opts.sessao ?? (await lerSessao());
    if (!sessao) throw new ApiError(401, "nao_autenticado", "Faça login para continuar.");
    h.Authorization = `Bearer ${sessao}`;
  }
  if (env.PORTAL_PROXY_SECRET) {
    h["X-Portal-Secret"] = env.PORTAL_PROXY_SECRET;
    const ip = await ipDoCliente();
    if (ip) h["X-Forwarded-For"] = ip;
  }

  let resp: Response;
  try {
    resp = await fetch(url, {
      method: opts.method ?? "GET",
      headers: h,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(env.API_TIMEOUT_MS),
    });
  } catch (e) {
    console.error("[api] falha de rede", path, (e as Error).name);
    throw new ApiError(503, "api_indisponivel", "Não foi possível falar com o servidor agora. Tente novamente em instantes.");
  }

  if (resp.status === 204) return undefined as T;
  const json = (await resp.json().catch(() => ({}))) as {
    error?: { code?: string; message?: string; details?: ApiError["details"] };
    request_id?: string;
  };
  if (!resp.ok) {
    throw new ApiError(
      resp.status,
      json.error?.code ?? "erro",
      json.error?.message ?? "Erro inesperado.",
      json.request_id,
      json.error?.details
    );
  }
  return json as T;
}

/** Percorre todas as páginas de uma listagem paginada (limite de segurança: 2.000 itens). */
export async function apiTodos<T>(path: string, query: Opcoes["query"] = {}, max = 2000): Promise<T[]> {
  const itens: T[] = [];
  for (let offset = 0; offset < max; offset += 200) {
    const pagina = await api<Pagina<T>>(path, { query: { ...query, limit: 200, offset } });
    itens.push(...pagina.items);
    if (itens.length >= pagina.total || pagina.items.length === 0) break;
  }
  return itens;
}

/**
 * Para Server Components: sessão inválida/expirada/revogada → encerra a sessão
 * local e volta ao login. Outros erros seguem para o error boundary.
 */
const CONTA_SEM_ACESSO = new Set(["sem_cadastro", "conta_desativada", "cadastro_pendente", "cadastro_recusado"]);

export function sessaoPerdida(e: unknown): boolean {
  return e instanceof ApiError && (e.status === 401 || (e.status === 403 && CONTA_SEM_ACESSO.has(e.code)));
}

export function tratarErroDePagina(e: unknown): never {
  if (sessaoPerdida(e)) {
    redirect("/auth/sessao-expirada");
  }
  throw e;
}

/** Atalho para páginas: executa a chamada e trata sessão expirada. */
export async function apiPagina<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    tratarErroDePagina(e);
  }
}

/** Dinheiro vem da API como string ("1200.00") para não perder precisão. */
export function num(v: string | number | null | undefined): number {
  if (v === null || v === undefined || v === "") return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}
