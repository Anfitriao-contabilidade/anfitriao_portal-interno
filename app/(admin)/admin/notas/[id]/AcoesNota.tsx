"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Ban, Eye, FileDown, Mail, RefreshCw, Replace, Trash2 } from "lucide-react";
import { ActionForm, useFormState } from "@/components/forms/ActionForm";
import { InputField, SelectField, TextareaField } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { cancelarNfse, consultarNfse, descartarNfse, enviarEmailNfse, substituirNfse } from "../nfse-actions";

export function ConsultarButton({ id, rotulo = "Consultar situação" }: { id: string; rotulo?: string }) {
  return (
    <ActionForm action={consultarNfse}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton variant="secondary" pendingLabel="Consultando a Sefin…">
        <RefreshCw className="h-4 w-4" aria-hidden /> {rotulo}
      </SubmitButton>
    </ActionForm>
  );
}

export function DescartarButton({ id }: { id: string }) {
  return (
    <ActionForm action={descartarNfse}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton variant="danger" pendingLabel="Descartando…">
        <Trash2 className="h-4 w-4" aria-hidden /> Descartar rascunho
      </SubmitButton>
    </ActionForm>
  );
}

export function LinkDocumento({ id, tipo, rotulo }: { id: string; tipo: "xml" | "danfse" | "dps" | "evento"; rotulo: string }) {
  return (
    <a
      href={`/nfse/documento/${id}/${tipo}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-ocean/20 bg-white px-3 text-sm font-medium text-ocean hover:bg-ocean-50"
    >
      <FileDown className="h-4 w-4" aria-hidden /> {rotulo}
      <span className="sr-only">(abre em nova aba)</span>
    </a>
  );
}

/** DANFSe oficial: abrir no navegador (visualizar) ou baixar o arquivo. */
export function DanfseLinks({ id }: { id: string }) {
  const cls = "inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-ocean/20 bg-white px-3 text-sm font-medium text-ocean hover:bg-ocean-50";
  return (
    <>
      <a href={`/nfse/documento/${id}/danfse?ver=1`} target="_blank" rel="noopener noreferrer" className={cls}>
        <Eye className="h-4 w-4" aria-hidden /> Visualizar DANFSe
        <span className="sr-only">(abre em nova aba)</span>
      </a>
      <a href={`/nfse/documento/${id}/danfse`} target="_blank" rel="noopener noreferrer" className={cls}>
        <FileDown className="h-4 w-4" aria-hidden /> Baixar DANFSe (PDF)
        <span className="sr-only">(abre em nova aba)</span>
      </a>
    </>
  );
}

export function EnviarEmailForm({ id, emailTomador }: { id: string; emailTomador?: string }) {
  return (
    <ActionForm action={enviarEmailNfse} className="grid gap-3">
      <input type="hidden" name="id" value={id} />
      <InputField
        label="Enviar para"
        name="destinatarios"
        type="text"
        defaultValue={emailTomador ?? ""}
        placeholder="email@exemplo.com, outro@exemplo.com"
        optional
        hint={emailTomador ? "Padrão: e-mail do tomador. Separe vários por vírgula (máx. 5)." : "O tomador não tem e-mail cadastrado: informe um destinatário."}
      />
      <TextareaField label="Mensagem (opcional)" name="mensagem" rows={3} maxLength={1000} optional />
      <SubmitButton variant="secondary" pendingLabel="Enviando…">
        <Mail className="h-4 w-4" aria-hidden /> Enviar DANFSe e XML por e-mail
      </SubmitButton>
    </ActionForm>
  );
}

export function CancelarForm({ id, producao, motivos }: { id: string; producao: boolean; motivos: Record<string, string> }) {
  return (
    <ActionForm action={cancelarNfse} className="grid gap-3">
      <input type="hidden" name="id" value={id} />
      <SelectField label="Motivo" name="codigo_motivo" required defaultValue="1">
        {Object.entries(motivos).map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </SelectField>
      <TextareaField label="Justificativa" name="motivo" required minLength={15} maxLength={255} rows={3} hint="15 a 255 caracteres (vai para o evento oficial)." />
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="confirmar" className="mt-1" required /> Confirmo o pedido de cancelamento desta NFS-e.
      </label>
      {producao && (
        <label className="flex items-start gap-2 text-sm font-medium text-gold-dark">
          <input type="checkbox" name="confirmar_producao" className="mt-1" required /> Estou ciente de que é um documento fiscal oficial (produção).
        </label>
      )}
      <div>
        <SubmitButton variant="danger" pendingLabel="Enviando cancelamento…">
          <Ban className="h-4 w-4" aria-hidden /> Cancelar NFS-e
        </SubmitButton>
      </div>
    </ActionForm>
  );
}

function IrParaSubstituta() {
  const state = useFormState();
  const router = useRouter();
  useEffect(() => {
    const novo = state.ok ? (state.resultado?.id as string | undefined) : undefined;
    if (novo) router.push(`/admin/notas/emitir?id=${novo}`);
  }, [state, router]);
  return null;
}

export function SubstituirForm({ id, motivos }: { id: string; motivos: Record<string, string> }) {
  return (
    <ActionForm action={substituirNfse} className="grid gap-3">
      <input type="hidden" name="id" value={id} />
      <IrParaSubstituta />
      <SelectField label="Motivo da substituição" name="codigo_motivo" required defaultValue="99">
        {Object.entries(motivos).map(([v, l]) => (
          <option key={v} value={v}>
            {v} — {l}
          </option>
        ))}
      </SelectField>
      <InputField label="Descrição do motivo" name="motivo" maxLength={255} optional hint="15 a 255 caracteres, se informada." />
      <div>
        <SubmitButton variant="secondary" pendingLabel="Criando rascunho…">
          <Replace className="h-4 w-4" aria-hidden /> Criar nota substituta
        </SubmitButton>
      </div>
    </ActionForm>
  );
}
