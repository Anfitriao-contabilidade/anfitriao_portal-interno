"use client";

import { Plus } from "lucide-react";
import { ActionForm } from "@/components/forms/ActionForm";
import { InputField } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { adicionarItemEstoque } from "./actions";

export function EstoqueForm({ imovelId, grupos, tipos }: { imovelId: string; grupos: string[]; tipos: string[] }) {
  const gid = `grupos-${imovelId}`;
  const tid = `tipos-${imovelId}`;
  return (
    <ActionForm action={adicionarItemEstoque} resetOnSuccess className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <input type="hidden" name="imovel_id" value={imovelId} />
      <InputField label="Grupo" name="grupo" list={gid} required maxLength={60} placeholder="Ex.: Enxoval" />
      <datalist id={gid}>
        {grupos.map((g) => (
          <option key={g} value={g} />
        ))}
      </datalist>
      <InputField label="Tipo" name="tipo" list={tid} required maxLength={60} placeholder="Ex.: Lençol" />
      <datalist id={tid}>
        {tipos.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
      <InputField label="Quantidade" name="quantidade" type="number" inputMode="numeric" min={1} max={10000} step={1} defaultValue={1} />
      <InputField label="Nome / marca" name="nome_marca" maxLength={120} optional placeholder="Ex.: Buddemeyer 200 fios" />
      <InputField label="Valor (R$)" name="valor" type="number" inputMode="decimal" min={0} step="0.01" optional />
      <div className="flex items-end">
        <SubmitButton className="w-full" pendingLabel="Adicionando…">
          <Plus className="h-4 w-4" aria-hidden /> Adicionar item
        </SubmitButton>
      </div>
    </ActionForm>
  );
}
