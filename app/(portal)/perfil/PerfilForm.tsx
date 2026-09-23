"use client";

import { ActionForm } from "@/components/forms/ActionForm";
import { InputField, SelectField } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { atualizarPerfil } from "./actions";

export type PerfilDados = {
  nome: string;
  tipo: "PF" | "PJ";
  documento: string;
  telefone: string;
  endereco: string;
};

export function PerfilForm({ perfil }: { perfil: PerfilDados }) {
  return (
    <ActionForm action={atualizarPerfil} className="grid gap-4 sm:grid-cols-2">
      <InputField label="Nome / Razão social" name="nome" defaultValue={perfil.nome} required maxLength={160} autoComplete="name" className="sm:col-span-2" />
      <SelectField label="Tipo de pessoa" name="tipo" defaultValue={perfil.tipo} required>
        <option value="PF">Pessoa Física</option>
        <option value="PJ">Pessoa Jurídica</option>
      </SelectField>
      <InputField
        label="CPF / CNPJ"
        name="documento"
        defaultValue={perfil.documento}
        inputMode="numeric"
        maxLength={18}
        optional
        hint="Necessário para emissão de notas fiscais."
      />
      <InputField label="Telefone" name="telefone" type="tel" defaultValue={perfil.telefone} autoComplete="tel" inputMode="tel" maxLength={25} optional placeholder="(11) 99999-9999" />
      <InputField label="Endereço" name="endereco" defaultValue={perfil.endereco} autoComplete="street-address" maxLength={300} optional className="sm:col-span-2" />
      <div className="sm:col-span-2">
        <SubmitButton>Salvar alterações</SubmitButton>
      </div>
    </ActionForm>
  );
}
