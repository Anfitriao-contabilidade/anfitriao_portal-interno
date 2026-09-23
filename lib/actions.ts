import type { z } from "zod";
import { ApiError } from "@/lib/api-error";

/** Resultado padrão de toda Server Action com formulário (useActionState). */
export type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Muda a cada envio — permite ao formulário reagir (ex.: limpar campos). */
  ts?: number;
};

export const initialActionState: ActionState = { ok: false };

export function ok(message: string): ActionState {
  return { ok: true, message, ts: Date.now() };
}

export function fail(message: string, fieldErrors?: Record<string, string>): ActionState {
  return { ok: false, message, fieldErrors, ts: Date.now() };
}

/** Converte os erros do Zod em { campo: "mensagem" } para exibir ao lado de cada input. */
export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function invalid(error: z.ZodError): ActionState {
  return fail("Revise os campos destacados.", zodFieldErrors(error));
}

/**
 * Registra o erro técnico só no servidor e devolve uma mensagem genérica ao
 * usuário — nunca expomos mensagens do banco/provedor (podem revelar
 * estrutura interna).
 */
export function serverError(context: string, err: unknown): ActionState {
  console.error(`[action:${context}]`, err);
  return fail("Não foi possível concluir a operação. Tente novamente em instantes.");
}

/**
 * Converte um erro da Anfitrião API em ActionState. Mensagens de regra de
 * negócio/permissão da API são pensadas para o usuário final e podem ser
 * exibidas; erros inesperados (5xx) viram mensagem genérica.
 */
export function apiFail(context: string, err: unknown, fieldMap: Record<string, string> = {}): ActionState {
  if (err instanceof ApiError) {
    if (err.status === 422 && err.code === "validacao") {
      const fieldErrors: Record<string, string> = {};
      for (const d of err.details ?? []) {
        const campo = String(d.loc?.[d.loc.length - 1] ?? "");
        const alvo = fieldMap[campo] ?? campo;
        if (alvo && !fieldErrors[alvo]) fieldErrors[alvo] = traduzirValidacao(d.msg);
      }
      return fail("Revise os campos destacados.", fieldErrors);
    }
    if (err.status === 401) return fail("Sua sessão expirou. Entre novamente.");
    if (err.status < 500 || err.code === "servico_externo") return fail(err.message);
    console.error(`[action:${context}]`, err.status, err.code, err.requestId);
    return fail(`Não foi possível concluir a operação. Tente novamente em instantes.${err.requestId ? ` (código ${err.requestId.slice(0, 8)})` : ""}`);
  }
  return serverError(context, err);
}

function traduzirValidacao(msg?: string) {
  if (!msg) return "Valor inválido";
  return msg.replace(/^Value error, /, "");
}

/** Lê o FormData como objeto simples (strings), pronto para validar com Zod. */
export function formToObject(formData: FormData): Record<string, string> {
  const obj: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string" && !(key in obj)) obj[key] = value;
  });
  return obj;
}
