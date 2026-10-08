"use client";

import { Send } from "lucide-react";
import { ActionForm } from "@/components/forms/ActionForm";
import { InputField, SelectField } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { criarCobranca } from "./actions";
import { FormaPagamentoOptions } from "./FormaPagamentoOptions";

type Cliente = { id: string; nome: string; temDocumento: boolean };

export function NovaCobrancaForm({ clientes, hoje }: { clientes: Cliente[]; hoje: string }) {
  return (
    <ActionForm action={criarCobranca} className="grid gap-4 sm:grid-cols-2" resetOnSuccess>
      <SelectField label="Cliente" name="cliente_id" required className="sm:col-span-2">
        <option value="">Selecione…</option>
        {clientes.map((c) => (
          <option key={c.id} value={c.id} disabled={!c.temDocumento}>
            {c.nome}
            {c.temDocumento ? "" : " (sem CPF/CNPJ)"}
          </option>
        ))}
      </SelectField>
      <InputField label="Valor (R$)" name="valor" type="number" inputMode="decimal" step="0.01" min={5} required />
      <InputField label="Vencimento" name="vencimento" type="date" min={hoje} defaultValue={hoje} required />
      <InputField
        label="Descrição"
        name="descricao"
        required
        maxLength={500}
        placeholder="Ex.: Abertura de CNPJ — taxa única"
        hint="Aparece na fatura do cliente."
        className="sm:col-span-2"
      />
      <SelectField label="Forma de pagamento" name="forma" defaultValue="indefinida" className="sm:col-span-2">
        <FormaPagamentoOptions />
      </SelectField>
      <div className="sm:col-span-2">
        <SubmitButton pendingLabel="Gerando…">
          <Send className="h-4 w-4" aria-hidden /> Gerar cobrança
        </SubmitButton>
      </div>
    </ActionForm>
  );
}
