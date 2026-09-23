"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { api } from "@/lib/api";
import { apiFail, fail, formToObject, invalid, ok, type ActionState } from "@/lib/actions";
import { estoqueItemSchema, objectId } from "@/lib/validation";

export async function adicionarItemEstoque(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = estoqueItemSchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const d = parsed.data;

  // A API confere se o imóvel é visível para o usuário (proprietário, co-anfitrião ou equipe).
  try {
    await api(`/imoveis/${d.imovel_id}/estoque`, {
      method: "POST",
      body: { grupo: d.grupo, tipo: d.tipo, quantidade: d.quantidade, nome_marca: d.nome_marca ?? null, valor: d.valor ?? null },
    });
  } catch (e) {
    return apiFail("estoque:add", e);
  }
  revalidatePath("/estoque");
  return ok(`${d.tipo} adicionado ao estoque.`);
}

export async function excluirItemEstoque(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const id = objectId.safeParse(formData.get("id"));
  const imovelId = objectId.safeParse(formData.get("imovel_id"));
  if (!id.success || !imovelId.success) return fail("Item inválido.");

  try {
    await api(`/imoveis/${imovelId.data}/estoque/${id.data}`, { method: "DELETE" });
  } catch (e) {
    return apiFail("estoque:delete", e);
  }
  revalidatePath("/estoque");
  return ok("Item removido.");
}
