"use server";

import { revalidatePath } from "next/cache";
import { getSessaoAdmin } from "@/lib/auth";
import { api } from "@/lib/api";
import { apiFail, fail, formToObject, invalid, ok, type ActionState } from "@/lib/actions";
import { objectId } from "@/lib/validation";
import { z } from "zod";

const SO_EQUIPE = "Apenas a equipe cadastra parceiros.";
const ESPECIALIDADES = ["limpeza", "lavanderia", "manutencao", "outro"] as const;

const schema = z.object({
  nome: z.string().trim().min(2, "Informe o nome").max(200),
  especialidade: z.enum(ESPECIALIDADES, "Escolha a especialidade"),
  telefone: z.string().trim().max(20).optional().or(z.literal("")),
  email: z.string().trim().max(254).optional().or(z.literal("")),
  observacao: z.string().trim().max(500).optional().or(z.literal("")),
  ativo: z.enum(["true", "false"]).optional(),
});

function corpo(d: z.infer<typeof schema>) {
  return {
    nome: d.nome,
    especialidade: d.especialidade,
    telefone: d.telefone || null,
    email: d.email || null,
    observacao: d.observacao || null,
    ativo: d.ativo !== "false",
  };
}

function revalidar() {
  revalidatePath("/admin/parceiros");
}

export async function criarParceiro(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await getSessaoAdmin())) return fail(SO_EQUIPE);
  const parsed = schema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  try {
    await api("/parceiros", { method: "POST", body: corpo(parsed.data) });
  } catch (e) {
    return apiFail("parceiro:criar", e);
  }
  revalidar();
  return ok("Parceiro cadastrado.");
}

export async function atualizarParceiro(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await getSessaoAdmin())) return fail(SO_EQUIPE);
  const id = objectId.safeParse(formData.get("id"));
  if (!id.success) return fail("Parceiro inválido.");
  const parsed = schema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  try {
    await api(`/parceiros/${id.data}`, { method: "PATCH", body: corpo(parsed.data) });
  } catch (e) {
    return apiFail("parceiro:atualizar", e);
  }
  revalidar();
  return ok("Parceiro atualizado.");
}

export async function removerParceiro(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await getSessaoAdmin())) return fail(SO_EQUIPE);
  const id = objectId.safeParse(formData.get("id"));
  if (!id.success) return fail("Parceiro inválido.");
  try {
    await api(`/parceiros/${id.data}`, { method: "DELETE" });
  } catch (e) {
    return apiFail("parceiro:remover", e);
  }
  revalidar();
  return ok("Parceiro removido.");
}
