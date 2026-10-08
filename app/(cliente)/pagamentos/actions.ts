"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { api } from "@/lib/api";
import { apiFail, formToObject, invalid, ok, type ActionState } from "@/lib/actions";
import { assinarPlanoSchema } from "@/lib/validation";
import type { Assinatura } from "@/lib/tipos";

/**
 * O próprio cliente assina um plano. Preço e ciclo vêm da API (preço atual da
 * vitrine, mensal) — o formulário só escolhe o plano e a forma de pagamento.
 */
export async function assinarPlano(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = assinarPlanoSchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  try {
    await api<Assinatura>("/pagamentos/assinaturas/assinar", { method: "POST", body: parsed.data });
  } catch (e) {
    return apiFail("pagamento:assinar", e);
  }
  revalidatePath("/pagamentos");
  return ok("Assinatura criada! A primeira fatura já está disponível abaixo.");
}
