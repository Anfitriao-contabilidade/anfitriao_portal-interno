"use client";

import { useState } from "react";
import { ActionForm } from "@/components/forms/ActionForm";
import { DocumentoField } from "@/components/forms/DocumentoField";
import { EnderecoFields, valoresDeDetalhe } from "@/components/forms/EnderecoFields";
import { FieldGroup, InputField, SelectField } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import type { EnderecoDetalhe } from "@/lib/tipos";
import { atualizarPerfil } from "./actions";

export type PerfilDados = {
  nome: string;
  tipo: "PF" | "PJ";
  documento: string;
  telefone: string;
  endereco: string;
  endereco_detalhe?: EnderecoDetalhe | null;
};

export function PerfilForm({ perfil }: { perfil: PerfilDados }) {
  const [tipo, setTipo] = useState<"PF" | "PJ">(perfil.tipo);
  return (
    <ActionForm action={atualizarPerfil} className="grid gap-4 sm:grid-cols-2">
      <InputField label="Nome / Razão social" name="nome" defaultValue={perfil.nome} required maxLength={160} autoComplete="name" className="sm:col-span-2" />
      <SelectField label="Tipo de pessoa" name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value === "PJ" ? "PJ" : "PF")} required>
        <option value="PF">Pessoa Física</option>
        <option value="PJ">Pessoa Jurídica</option>
      </SelectField>
      <DocumentoField defaultValue={perfil.documento} tipo={tipo} optional hint="Necessário para emissão de notas fiscais." />
      <InputField label="Telefone" name="telefone" type="tel" defaultValue={perfil.telefone} autoComplete="tel" inputMode="tel" maxLength={25} optional placeholder="(11) 99999-9999" />
      <FieldGroup title="Endereço">
        <EnderecoFields valores={valoresDeDetalhe(perfil.endereco_detalhe)} legado={perfil.endereco_detalhe ? null : perfil.endereco} />
        {!perfil.endereco_detalhe && perfil.endereco && <input type="hidden" name="endereco_legado" value={perfil.endereco} />}
      </FieldGroup>
      <div className="sm:col-span-2">
        <SubmitButton>Salvar alterações</SubmitButton>
      </div>
    </ActionForm>
  );
}
