"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessaoAdmin } from "@/lib/auth";
import { api } from "@/lib/api";
import { apiFail, fail, formToObject, invalid, ok, type ActionState } from "@/lib/actions";
import { clienteAdminSchema, uid } from "@/lib/validation";

const SO_EQUIPE = "Apenas a equipe da Anfitrião pode gerenciar clientes.";

function papeisDe(perfil: "proprietario" | "coanfitriao" | "ambos") {
  return perfil === "ambos" ? ["coanfitriao", "proprietario"] : [perfil];
}

/** Equipe atualiza o cadastro de um cliente (a API repete a checagem de admin). */
export async function atualizarCliente(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await getSessaoAdmin();
  if (!admin) return fail(SO_EQUIPE);

  const parsed = clienteAdminSchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const d = parsed.data;
  const ativo = formData.get("ativo");

  try {
    await api(`/usuarios/${d.id}`, {
      method: "PATCH",
      body: {
        nome: d.nome,
        tipo: d.tipo,
        documento: d.documento ?? null,
        telefone: d.telefone ?? null,
        endereco: d.endereco ?? null,
        plano: d.plano ?? null,
        status_fiscal: d.status_fiscal,
        papeis: papeisDe(d.perfil_atuacao),
        ...(ativo === "true" || ativo === "false" ? { ativo: ativo === "true" } : {}),
      },
    });
  } catch (e) {
    return apiFail("clientes:update", e);
  }
  revalidatePath("/admin/clientes");
  return ok(`Cadastro de ${d.nome} atualizado.`);
}

/** Aprova um cadastro público pendente (libera o login). */
export async function aprovarCadastro(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await getSessaoAdmin();
  if (!admin) return fail(SO_EQUIPE);
  const id = uid.safeParse(formData.get("id"));
  const perfil = String(formData.get("perfil_atuacao") ?? "");
  if (!id.success) return fail("Cadastro inválido.");
  const papeis = perfil === "proprietario" || perfil === "coanfitriao" || perfil === "ambos" ? papeisDe(perfil) : undefined;

  try {
    await api(`/usuarios/${id.data}/aprovar`, { method: "POST", body: papeis ? { papeis } : {} });
  } catch (e) {
    return apiFail("clientes:aprovar", e);
  }
  revalidatePath("/admin/clientes");
  // O item some da lista de pendentes (e com ele o formulário): o aviso vai pela URL.
  redirect("/clientes?cadastro=aprovado");
}

export async function recusarCadastro(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await getSessaoAdmin();
  if (!admin) return fail(SO_EQUIPE);
  const id = uid.safeParse(formData.get("id"));
  if (!id.success) return fail("Cadastro inválido.");
  try {
    await api(`/usuarios/${id.data}/recusar`, { method: "POST", body: {} });
  } catch (e) {
    return apiFail("clientes:recusar", e);
  }
  revalidatePath("/admin/clientes");
  redirect("/clientes?cadastro=recusado");
}
