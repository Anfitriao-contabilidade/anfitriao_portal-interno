"use client";

import { ActionForm } from "@/components/forms/ActionForm";
import { InputField, SelectField } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { criarUsuario } from "./actions";

export function NovoUsuarioForm() {
  return (
    <ActionForm action={criarUsuario} className="grid gap-4 sm:grid-cols-2" resetOnSuccess>
      <InputField label="Nome" name="nome" required maxLength={160} className="sm:col-span-2" />
      <InputField label="E-mail" name="email" type="email" required maxLength={254} autoComplete="off" />
      <SelectField label="Acesso" name="papel" required defaultValue="proprietario">
        <option value="proprietario">Cliente — proprietário</option>
        <option value="coanfitriao">Cliente — coanfitrião</option>
        <option value="ambos">Cliente — proprietário e coanfitrião</option>
        <option value="admin">Colaborador — admin</option>
      </SelectField>
      <SelectField label="Tipo" name="tipo" defaultValue="PF">
        <option value="PF">Pessoa física</option>
        <option value="PJ">Pessoa jurídica</option>
      </SelectField>
      <InputField label="CPF / CNPJ" name="documento" inputMode="numeric" maxLength={18} optional />
      <InputField label="Telefone" name="telefone" type="tel" maxLength={25} optional />
      <InputField label="Endereço" name="endereco" maxLength={300} optional className="sm:col-span-2" />
      <div className="sm:col-span-2">
        <SubmitButton>Criar usuário</SubmitButton>
      </div>
    </ActionForm>
  );
}
