"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { apiFail, fail, ok, type ActionState } from "@/lib/actions";
import { MENSAGEM_SUBSTITUIR, montarUploadCertificado } from "@/lib/certificados";

/** Cadastra/substitui o certificado do próprio usuário (POST /me/certificado). */
export async function enviarMeuCertificado(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const upload = montarUploadCertificado(formData);
  if ("erro" in upload) return upload.erro;
  try {
    await api("/me/certificado", { method: "POST", form: upload.form });
  } catch (e) {
    if (e instanceof ApiError && e.code === "certificado_existente") return fail(MENSAGEM_SUBSTITUIR);
    if (e instanceof ApiError && e.code === "senha_incorreta") return fail(e.message, { senha: e.message });
    return apiFail("certificado:enviar", e);
  }
  revalidatePath("/certificado");
  revalidatePath("/perfil");
  revalidatePath("/");
  return ok("Certificado validado e cadastrado com sucesso.");
}

export async function excluirMeuCertificado(): Promise<ActionState> {
  await requireUser();
  try {
    await api("/me/certificado", { method: "DELETE", query: { confirmar: true } });
  } catch (e) {
    return apiFail("certificado:excluir", e);
  }
  revalidatePath("/certificado");
  revalidatePath("/perfil");
  revalidatePath("/");
  return ok("Certificado removido.");
}
