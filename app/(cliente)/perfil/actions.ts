"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { api } from "@/lib/api";
import { apiFail, formToObject, invalid, ok, type ActionState } from "@/lib/actions";
import { perfilSchema } from "@/lib/validation";

export async function atualizarPerfil(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = perfilSchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);

  const d = parsed.data;
  // PATCH /me aceita só dados cadastrais (extra=forbid na API): papéis, plano e
  // status fiscal nunca podem ser alterados pelo próprio cliente.
  try {
    await api("/me", {
      method: "PATCH",
      body: {
        nome: d.nome,
        tipo: d.tipo,
        documento: d.documento ?? null,
        telefone: d.telefone ?? null,
        endereco: d.endereco ?? null,
      },
    });
  } catch (e) {
    return apiFail("perfil", e);
  }
  revalidatePath("/", "layout");
  revalidatePath("/admin/perfil");
  return ok("Dados atualizados com sucesso.");
}
