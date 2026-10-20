"use server";

import { revalidatePath } from "next/cache";
import { getSessaoAdmin } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { apiFail, fail, ok, type ActionState } from "@/lib/actions";
import { MENSAGEM_SUBSTITUIR, montarUploadCertificado } from "@/lib/certificados";
import { uid as uidSchema } from "@/lib/validation";

const SO_EQUIPE = "Apenas a equipe pode gerenciar certificados de outros usuários.";

function revalidar(uid: string) {
  revalidatePath("/admin/certificados");
  revalidatePath(`/admin/certificados/${uid}`);
}

/** Cadastro/substituição em nome do usuário (POST /certificados/usuarios/{uid}). */
export async function enviarCertificadoUsuario(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await getSessaoAdmin())) return fail(SO_EQUIPE);
  const uid = uidSchema.safeParse(formData.get("uid"));
  if (!uid.success) return fail("Usuário inválido.");
  const upload = montarUploadCertificado(formData);
  if ("erro" in upload) return upload.erro;
  try {
    await api(`/certificados/usuarios/${uid.data}`, { method: "POST", form: upload.form });
  } catch (e) {
    if (e instanceof ApiError && e.code === "certificado_existente") return fail(MENSAGEM_SUBSTITUIR);
    if (e instanceof ApiError && e.code === "senha_incorreta") return fail(e.message, { senha: e.message });
    return apiFail("certificado:admin:enviar", e);
  }
  revalidar(uid.data);
  return ok("Certificado validado e cadastrado para o usuário.");
}

export async function excluirCertificadoUsuario(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await getSessaoAdmin())) return fail(SO_EQUIPE);
  const uid = uidSchema.safeParse(formData.get("id"));
  if (!uid.success) return fail("Usuário inválido.");
  try {
    await api(`/certificados/usuarios/${uid.data}`, { method: "DELETE", query: { confirmar: true } });
  } catch (e) {
    return apiFail("certificado:admin:excluir", e);
  }
  revalidar(uid.data);
  return ok("Certificado removido.");
}

export async function executarMonitor(): Promise<ActionState> {
  if (!(await getSessaoAdmin())) return fail(SO_EQUIPE);
  try {
    const r = await api<{ verificados: number; revogados: number; alertas: number; expurgados: number }>(
      "/certificados/monitor/executar",
      { method: "POST" }
    );
    revalidatePath("/admin/certificados");
    return ok(
      `Verificação concluída: ${r.verificados} certificado(s), ${r.alertas} alerta(s), ${r.revogados} revogado(s), ${r.expurgados} expurgado(s).`
    );
  } catch (e) {
    return apiFail("certificado:monitor", e);
  }
}
