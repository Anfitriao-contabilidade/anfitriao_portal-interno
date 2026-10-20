import { fail, type ActionState } from "@/lib/actions";
import type { SituacaoCertificado } from "@/lib/tipos";

/** Limite espelhado da API (CERTIFICADO_MAX_BYTES). A API valida de novo — esta checagem só poupa o envio. */
export const CERTIFICADO_MAX_BYTES = 64 * 1024;
const EXTENSOES = [".pfx", ".p12"];

export const ROTULO_SITUACAO: Record<SituacaoCertificado, string> = {
  valido: "Válido",
  proximo_vencimento: "Próximo do vencimento",
  vencido: "Vencido",
  invalido: "Inválido",
  nao_cadastrado: "Não cadastrado",
};

export const TOM_SITUACAO: Record<SituacaoCertificado, "success" | "warning" | "danger" | "neutral"> = {
  valido: "success",
  proximo_vencimento: "warning",
  vencido: "danger",
  invalido: "danger",
  nao_cadastrado: "neutral",
};

export function ehSituacao(v: string | undefined): v is SituacaoCertificado {
  return !!v && v in ROTULO_SITUACAO;
}

/**
 * Lê arquivo + senha do formulário e monta o multipart para a API.
 * A senha só trafega servidor-a-servidor (HTTPS) e nunca é registrada em log.
 */
export function montarUploadCertificado(formData: FormData): { form: FormData } | { erro: ActionState } {
  const arquivo = formData.get("arquivo");
  const senha = formData.get("senha");
  const substituir = formData.get("substituir") === "on" || formData.get("substituir") === "true";
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { erro: fail("Selecione o arquivo do certificado.", { arquivo: "Selecione um arquivo .pfx ou .p12" }) };
  }
  const nome = arquivo.name.toLowerCase();
  if (!EXTENSOES.some((e) => nome.endsWith(e))) {
    return { erro: fail("Formato não permitido.", { arquivo: "Envie um arquivo .pfx ou .p12" }) };
  }
  if (arquivo.size > CERTIFICADO_MAX_BYTES) {
    return { erro: fail("Arquivo grande demais.", { arquivo: `Limite de ${CERTIFICADO_MAX_BYTES / 1024} KB` }) };
  }
  if (typeof senha !== "string" || senha.length === 0 || senha.length > 256) {
    return { erro: fail("Informe a senha do certificado.", { senha: "Informe a senha do certificado" }) };
  }
  const form = new FormData();
  form.set("arquivo", arquivo, arquivo.name);
  form.set("senha", senha);
  form.set("substituir", substituir ? "true" : "false");
  return { form };
}

export const MENSAGEM_SUBSTITUIR =
  "Já existe um certificado ativo. Marque a confirmação de substituição para continuar.";
