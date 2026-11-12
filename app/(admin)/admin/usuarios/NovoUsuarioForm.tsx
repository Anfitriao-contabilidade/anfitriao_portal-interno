"use client";

import { useState } from "react";
import { ActionForm } from "@/components/forms/ActionForm";
import { DocumentoField } from "@/components/forms/DocumentoField";
import { EnderecoFields } from "@/components/forms/EnderecoFields";
import { FieldGroup, InputField, SelectField } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { criarUsuario } from "./actions";

export function NovoUsuarioForm() {
  const [tipo, setTipo] = useState<"PF" | "PJ">("PF");
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
      <SelectField label="Tipo" name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value === "PJ" ? "PJ" : "PF")}>
        <option value="PF">Pessoa física</option>
        <option value="PJ">Pessoa jurídica</option>
      </SelectField>
      <DocumentoField tipo={tipo} optional resetOnSuccess />
      <InputField label="Telefone" name="telefone" type="tel" maxLength={25} optional />
      <FieldGroup title="Endereço">
        <EnderecoFields resetOnSuccess />
      </FieldGroup>
      <div className="sm:col-span-2">
        <SubmitButton>Criar usuário</SubmitButton>
      </div>
    </ActionForm>
  );
}
