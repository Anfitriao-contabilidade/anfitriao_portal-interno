"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Ban, FileDown, RefreshCw, Replace, Trash2 } from "lucide-react";
import { ActionForm, useFormState } from "@/components/forms/ActionForm";
import { InputField, SelectField, TextareaField } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { cancelarNfse, consultarNfse, descartarNfse, substituirNfse } from "../nfse-actions";

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
