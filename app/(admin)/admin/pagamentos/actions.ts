"use server";

import { revalidatePath } from "next/cache";
import { getSessaoAdmin } from "@/lib/auth";
import { api } from "@/lib/api";
import { apiFail, fail, formToObject, invalid, ok, type ActionState } from "@/lib/actions";
import { assinaturaAdminSchema, cobrancaSchema, objectId } from "@/lib/validation";
import type { Assinatura, Cobranca } from "@/lib/tipos";

const NAO_AUTORIZADO = "Apenas a equipe da Anfitrião pode gerenciar cobranças.";

function revalidar() {
  revalidatePath("/admin/pagamentos");
  revalidatePath("/pagamentos");
}

/**
 * Cobranças e assinaturas pelo Asaas. Toda a regra (cliente no Asaas, registro
 * local antes da chamada, webhook, auditoria) está na API — a chave do Asaas
 * nunca passa pelo portal.
 */
export async function criarCobranca(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await getSessaoAdmin())) return fail(NAO_AUTORIZADO);
  const parsed = cobrancaSchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const d = parsed.data;
  let c: Cobranca;
  try {
    c = await api<Cobranca>("/pagamentos/cobrancas", {
      method: "POST",
      body: { ...d, valor: d.valor.toFixed(2) },
    });
  } catch (e) {
    return apiFail("pagamento:cobranca", e);
  }
  revalidar();
  return ok(c.url_fatura ? "Cobrança gerada — o cliente já vê o link de pagamento no portal." : "Cobrança registrada.");
}

export async function criarAssinatura(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await getSessaoAdmin())) return fail(NAO_AUTORIZADO);
  const parsed = assinaturaAdminSchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const d = parsed.data;
  try {
    await api<Assinatura>("/pagamentos/assinaturas", {
      method: "POST",
      body: { ...d, valor: d.valor !== undefined ? d.valor.toFixed(2) : null },
    });
  } catch (e) {
    return apiFail("pagamento:assinatura", e);
  }
  revalidar();
  return ok("Assinatura criada — a primeira cobrança já foi gerada.");
}

type Recurso = "cobrancas" | "assinaturas";
type Operacao = "cancelar" | "sincronizar";

async function operar(recurso: Recurso, operacao: Operacao, formData: FormData): Promise<ActionState> {
  if (!(await getSessaoAdmin())) return fail(NAO_AUTORIZADO);
  const id = objectId.safeParse(formData.get("id"));
  if (!id.success) return fail("Registro inválido.");
  try {
    await api(`/pagamentos/${recurso}/${id.data}/${operacao}`, { method: "POST" });
  } catch (e) {
    return apiFail(`pagamento:${recurso}:${operacao}`, e);
  }
  revalidar();
  return ok(operacao === "cancelar" ? "Cancelado no Asaas." : "Status atualizado.");
}

export async function cancelarCobranca(_prev: ActionState, formData: FormData) {
  return operar("cobrancas", "cancelar", formData);
}
export async function sincronizarCobranca(_prev: ActionState, formData: FormData) {
  return operar("cobrancas", "sincronizar", formData);
}
export async function cancelarAssinatura(_prev: ActionState, formData: FormData) {
  return operar("assinaturas", "cancelar", formData);
}
export async function sincronizarAssinatura(_prev: ActionState, formData: FormData) {
  return operar("assinaturas", "sincronizar", formData);
}
