"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { api } from "@/lib/api";
import { apiFail, ok, type ActionState } from "@/lib/actions";

export async function enviarExtrato(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const sessao = await requireUser();
  try {
    const r = await api<{ total_linhas: number }>("/extratos", {
      method: "POST",
      body: { cliente_id: sessao.id, texto: String(formData.get("texto") || "") },
    });
    revalidatePath("/extrato");
    return ok(`${r.total_linhas} linha(s) lançada(s).`);
  } catch (e) {
    return apiFail("extrato:cliente", e);
  }
}
