"use client";

import { useState } from "react";
import { FileKey, RefreshCw, Upload } from "lucide-react";
import { ActionForm } from "@/components/forms/ActionForm";
import { InputField } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { buttonClass } from "@/components/ui/Button";
import type { ActionState } from "@/lib/actions";

type Acao = (state: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * Upload do certificado A1 (.pfx/.p12) + senha. Com certificado ativo, o formulário
 * só abre por ação explícita e exige marcar a confirmação de substituição (a API
 * também recusa substituir sem ela).
 */
export function CertificadoUploadForm({
  action,
  temCertificado,
  uid,
}: {
  action: Acao;
  temCertificado: boolean;
  /** Preenchido no painel da equipe (cadastro em nome do usuário). */
  uid?: string;
}) {
  const [aberto, setAberto] = useState(!temCertificado);

  if (!aberto) {
    return (
      <button type="button" onClick={() => setAberto(true)} className={buttonClass("secondary", "sm")}>
        <RefreshCw className="h-4 w-4" aria-hidden />
        Substituir certificado
      </button>
    );
  }

  return (
    <ActionForm action={action} className="space-y-4" resetOnSuccess aria-label="Enviar certificado digital">
      {uid && <input type="hidden" name="uid" value={uid} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label="Arquivo do certificado A1"
          name="arquivo"
          type="file"
          accept=".pfx,.p12,application/x-pkcs12"
          required
          hint="Formato .pfx ou .p12 (até 64 KB)."
        />
        <InputField
          label="Senha do certificado"
          name="senha"
          type="password"
          autoComplete="off"
          required
          maxLength={256}
          hint="Usada para validar o arquivo. É guardada criptografada e nunca é exibida."
        />
      </div>
      {temCertificado && (
        <label className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <input type="checkbox" name="substituir" required className="mt-0.5 h-4 w-4 rounded border-line" />
          <span>
            Confirmo a <strong>substituição</strong> do certificado atual. O arquivo anterior será descartado e as próximas
            operações fiscais usarão o novo certificado.
          </span>
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        <SubmitButton pendingLabel="Validando certificado…">
          {temCertificado ? <RefreshCw className="h-4 w-4" aria-hidden /> : <Upload className="h-4 w-4" aria-hidden />}
          {temCertificado ? "Substituir certificado" : "Adicionar certificado"}
        </SubmitButton>
        {temCertificado && (
          <button type="button" onClick={() => setAberto(false)} className={buttonClass("ghost", "md")}>
            Cancelar
          </button>
        )}
      </div>
      <p className="flex items-start gap-2 text-xs text-ink-soft">
        <FileKey className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        O arquivo é validado e armazenado criptografado em ambiente privado. Ninguém da equipe consegue ver a senha.
      </p>
    </ActionForm>
  );
}
