import "server-only";
import { api, ApiError, apiPagina } from "@/lib/api";
import type { CertificadoStatus } from "@/lib/tipos";

/** GET /me/certificado com mensagens amigáveis quando a API não pode responder. */
export async function carregarMeuCertificado(): Promise<{ status: CertificadoStatus | null; indisponivel: string | null }> {
  try {
    return { status: await apiPagina(() => api<CertificadoStatus>("/me/certificado")), indisponivel: null };
  } catch (e) {
    if (!(e instanceof ApiError) || e.status < 422) throw e;
    if (e.code === "certificados_desabilitados") {
      return {
        status: null,
        indisponivel: "O cadastro de certificados digitais ainda não está disponível. Fale com a equipe Anfitrião.",
      };
    }
    if (e.code === "perfil_sem_certificado") {
      return { status: null, indisponivel: "Certificados digitais são cadastrados apenas por Proprietários e Anfitriões." };
    }
    return { status: null, indisponivel: "Não foi possível consultar o certificado agora. Tente novamente em instantes." };
  }
}
