"use client";

import { useState } from "react";
import { Repeat } from "lucide-react";
import { ActionForm } from "@/components/forms/ActionForm";
import { InputField, SelectField } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { criarAssinatura } from "./actions";
import { FormaPagamentoOptions } from "./FormaPagamentoOptions";

type Cliente = { id: string; nome: string; temDocumento: boolean; temAssinatura: boolean };
type Plano = { id: string; titulo: string; preco: string };

export function NovaAssinaturaForm({
  clientes,
  planos,
  hoje,
}: {
  clientes: Cliente[];
  planos: Plano[];
  hoje: string;
}) {
  const [planoId, setPlanoId] = useState("");
  const plano = planos.find((p) => p.id === planoId);

  return (
    <ActionForm action={criarAssinatura} className="grid gap-4 sm:grid-cols-2" resetOnSuccess>
      <SelectField label="Cliente" name="cliente_id" required className="sm:col-span-2">
        <option value="">Selecione…</option>
        {clientes.map((c) => (
          <option key={c.id} value={c.id} disabled={!c.temDocumento || c.temAssinatura}>
            {c.nome}
            {!c.temDocumento ? " (sem CPF/CNPJ)" : c.temAssinatura ? " (já tem assinatura)" : ""}
          </option>
        ))}
      </SelectField>
      <SelectField label="Plano" name="plano_id" required value={planoId} onChange={(e) => setPlanoId(e.target.value)}>
        <option value="">Selecione…</option>
        {planos.map((p) => (
          <option key={p.id} value={p.id}>
            {p.titulo} — {p.preco}
          </option>
        ))}
      </SelectField>
      <InputField
        label="Valor por ciclo (R$)"
        name="valor"
        type="number"
        inputMode="decimal"
        step="0.01"
        min={5}
        optional
        placeholder={plano ? plano.preco.replace(/[^\d,]/g, "") : ""}
        hint="Vazio = preço atual do plano."
      />
      <SelectField label="Ciclo" name="ciclo" defaultValue="mensal">
        <option value="mensal">Mensal</option>
        <option value="trimestral">Trimestral</option>
        <option value="semestral">Semestral</option>
        <option value="anual">Anual</option>
      </SelectField>
      <InputField label="1º vencimento" name="proximo_vencimento" type="date" min={hoje} defaultValue={hoje} required />
      <SelectField label="Forma de pagamento" name="forma" defaultValue="indefinida" className="sm:col-span-2">
        <FormaPagamentoOptions />
      </SelectField>
      <div className="sm:col-span-2">
        <SubmitButton pendingLabel="Criando…">
          <Repeat className="h-4 w-4" aria-hidden /> Criar assinatura
        </SubmitButton>
      </div>
    </ActionForm>
  );
}
