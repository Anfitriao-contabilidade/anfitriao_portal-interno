"use client";

import { Check, X } from "lucide-react";
import { ActionForm } from "@/components/forms/ActionForm";
import { SelectField } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { aprovarCadastro, recusarCadastro } from "./actions";

/** Aprovar (com ajuste do perfil pedido) ou recusar um cadastro público pendente. */
export function AprovacaoForm({ id, perfil }: { id: string; perfil: string }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <ActionForm action={aprovarCadastro} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <input type="hidden" name="id" value={id} />
        <SelectField label="Perfil de atuação" name="perfil_atuacao" defaultValue={perfil}>
          <option value="proprietario">Proprietário</option>
          <option value="coanfitriao">Co-Anfitrião</option>
          <option value="ambos">Ambos</option>
        </SelectField>
        <SubmitButton size="sm" pendingLabel="Aprovando…">
          <Check className="h-4 w-4" aria-hidden /> Aprovar
        </SubmitButton>
      </ActionForm>
      <ActionForm action={recusarCadastro}>
        <input type="hidden" name="id" value={id} />
        <SubmitButton size="sm" variant="danger" pendingLabel="Recusando…">
          <X className="h-4 w-4" aria-hidden /> Recusar
        </SubmitButton>
      </ActionForm>
    </div>
  );
}
