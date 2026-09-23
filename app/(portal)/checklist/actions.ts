"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { api } from "@/lib/api";
import { apiFail, fail, ok, type ActionState } from "@/lib/actions";
import { objectId } from "@/lib/validation";
import { CHECKLIST_APTO_CATEGORIAS, checklistItemKey } from "@/lib/checklistApto";
import type { Checklist } from "@/lib/tipos";

// Conjunto fechado de chaves válidas — qualquer outra coisa enviada é descartada (a API também valida).
const CHAVES_VALIDAS = new Set(
  CHECKLIST_APTO_CATEGORIAS.flatMap((cat, ci) => cat.itens.map((_, ii) => checklistItemKey(ci, ii)))
);

export async function salvarChecklistApto(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const imovelId = objectId.safeParse(formData.get("imovel_id"));
  if (!imovelId.success) return fail("Imóvel inválido.");

  const itens = Array.from(new Set(formData.getAll("item").map(String))).filter((k) => CHAVES_VALIDAS.has(k));

  let r: Checklist;
  try {
    r = await api<Checklist>(`/imoveis/${imovelId.data}/checklist`, { method: "PUT", body: { itens } });
  } catch (e) {
    return apiFail("checklist:save", e);
  }

  revalidatePath("/checklist");
  revalidatePath("/clientes");
  return ok(`Checklist salvo — nota ${r.nota.toFixed(1).replace(".", ",")}/10.`);
}
