"use client";

import { ActionForm } from "@/components/forms/ActionForm";
import { InputField, SelectField, TextareaField } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { atualizarParceiro, criarParceiro, removerParceiro } from "./actions";

const OPCOES = [
  ["limpeza", "Limpeza"],
  ["lavanderia", "Lavanderia"],
  ["manutencao", "Manutenção"],
  ["outro", "Outro"],
] as const;

export function NovoParceiroForm() {
  return (
    <ActionForm action={criarParceiro} className="grid gap-4 sm:grid-cols-2" resetOnSuccess>
      <InputField label="Nome" name="nome" required maxLength={200} className="sm:col-span-2" />
      <SelectField label="Especialidade" name="especialidade" required defaultValue="limpeza">
        {OPCOES.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </SelectField>
      <InputField label="Telefone" name="telefone" type="tel" maxLength={20} optional />
      <InputField label="E-mail" name="email" type="email" maxLength={254} optional className="sm:col-span-2" />
      <TextareaField label="Observação" name="observacao" optional rows={2} className="sm:col-span-2" />
      <div className="sm:col-span-2">
        <SubmitButton>Cadastrar</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function ParceiroForm({
  p,
}: {
  p: { id: string; nome: string; especialidade: string; telefone: string; email: string; observacao: string; ativo: boolean };
}) {
  return (
    <div className="grid gap-4">
      <ActionForm action={atualizarParceiro} className="grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="id" value={p.id} />
        <InputField label="Nome" name="nome" defaultValue={p.nome} required maxLength={200} className="sm:col-span-2" />
        <SelectField label="Especialidade" name="especialidade" defaultValue={p.especialidade}>
          {OPCOES.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </SelectField>
        <SelectField label="Situação" name="ativo" defaultValue={p.ativo ? "true" : "false"}>
          <option value="true">Ativo</option>
          <option value="false">Inativo</option>
        </SelectField>
        <InputField label="Telefone" name="telefone" defaultValue={p.telefone} maxLength={20} optional />
        <InputField label="E-mail" name="email" defaultValue={p.email} maxLength={254} optional />
        <TextareaField label="Observação" name="observacao" defaultValue={p.observacao} optional rows={2} className="sm:col-span-2" />
        <SubmitButton>Salvar</SubmitButton>
      </ActionForm>
      <ActionForm action={removerParceiro}>
        <input type="hidden" name="id" value={p.id} />
        <SubmitButton variant="danger" size="sm">Remover</SubmitButton>
      </ActionForm>
    </div>
  );
}
