"use server";

import { revalidatePath } from "next/cache";
import { getSessaoAdmin } from "@/lib/auth";
import { api } from "@/lib/api";
import { apiFail, fail, formToObject, invalid, ok, type ActionState } from "@/lib/actions";
import { clienteAdminSchema, uid, usuarioNovoSchema } from "@/lib/validation";
import type { Papel } from "@/lib/tipos";

const SO_EQUIPE = "Apenas a equipe pode gerenciar usuários.";

function papeisDe(papel: "proprietario" | "coanfitriao" | "ambos" | "admin"): Papel[] {
  if (papel === "ambos") return ["proprietario", "coanfitriao"];
  return [papel];
}

function revalidar() {
  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/clientes");
  revalidatePath("/admin/imoveis");
}

export async function criarUsuario(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await getSessaoAdmin();
  if (!admin) return fail(SO_EQUIPE);
  const parsed = usuarioNovoSchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const d = parsed.data;

  try {
    const r = await api<{ link_definir_senha: string | null }>("/usuarios", {
      method: "POST",
      body: {
        email: d.email,
        nome: d.nome,
        papeis: papeisDe(d.papel),
        tipo: d.tipo,
        documento: d.documento ?? null,
        telefone: d.telefone ?? null,
        endereco: d.endereco ?? null,
      },
    });
    revalidar();
    const link = r.link_definir_senha
      ? ` Envie este link de definição de senha (ele expira): ${r.link_definir_senha}`
      : " A conta foi criada; gere o link de senha de novo se o e-mail não chegar.";
    return ok(`Usuário criado.${link}`);
  } catch (e) {
    return apiFail("usuario:criar", e);
  }
}

export async function atualizarUsuario(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await getSessaoAdmin();
  if (!admin) return fail(SO_EQUIPE);
  const parsed = clienteAdminSchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const d = parsed.data;
  const papel = String(formData.get("papel_acesso") || d.perfil_atuacao);
  const acesso = papel === "admin" || papel === "proprietario" || papel === "coanfitriao" || papel === "ambos" ? papel : d.perfil_atuacao;
  const ativo = formData.get("ativo") === "true";
  if (d.id === admin.id && acesso !== "admin") return fail("Você não pode remover o próprio papel de admin.");
  if (d.id === admin.id && !ativo) return fail("Você não pode desativar a própria conta.");

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
        papeis: papeisDe(acesso),
        ativo,
      },
    });
  } catch (e) {
    return apiFail("usuario:atualizar", e);
  }
  revalidar();
  return ok("Usuário atualizado.");
}

export async function gerarLinkSenha(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await getSessaoAdmin();
  if (!admin) return fail(SO_EQUIPE);
  const id = uid.safeParse(formData.get("id"));
  if (!id.success) return fail("Usuário inválido.");
  try {
    const r = await api<{ link_definir_senha: string }>(`/usuarios/${id.data}/link-senha`, { method: "POST" });
    return ok(`Link de definição de senha: ${r.link_definir_senha}`);
  } catch (e) {
    return apiFail("usuario:link", e);
  }
}
