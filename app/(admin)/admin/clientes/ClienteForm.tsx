"use client";

import { useState } from "react";
import { ActionForm } from "@/components/forms/ActionForm";
import { DocumentoField } from "@/components/forms/DocumentoField";
import { EnderecoFields, valoresDeDetalhe } from "@/components/forms/EnderecoFields";
import { FieldGroup, InputField, SelectField } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import type { EnderecoDetalhe } from "@/lib/tipos";
import { atualizarCliente } from "./actions";

export type ClienteDados = {
  id: string;
  nome: string;
  tipo: string;
  documento: string;
  telefone: string;
  endereco: string;
  endereco_detalhe?: EnderecoDetalhe | null;
  plano: string;
  status_fiscal: string;
  perfil_atuacao: string;
  ativo: boolean;
};

export function ClienteForm({ c }: { c: ClienteDados }) {
  const [tipo, setTipo] = useState<"PF" | "PJ">(c.tipo === "PJ" ? "PJ" : "PF");
  return (
    <ActionForm action={atualizarCliente} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="id" value={c.id} />
      <InputField label="Nome / Razão social" name="nome" defaultValue={c.nome} required maxLength={160} className="sm:col-span-2" />
      <SelectField label="Tipo" name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value === "PJ" ? "PJ" : "PF")}>
        <option value="PF">Pessoa Física</option>
        <option value="PJ">Pessoa Jurídica</option>
      </SelectField>
      <DocumentoField defaultValue={c.documento} tipo={tipo} optional />
      <InputField label="Telefone" name="telefone" type="tel" defaultValue={c.telefone} inputMode="tel" maxLength={25} optional />
      <InputField label="Plano" name="plano" defaultValue={c.plano} maxLength={60} optional placeholder="Básico, Padrão, Experts Essencial…" />
      <FieldGroup title="Endereço">
        <EnderecoFields valores={valoresDeDetalhe(c.endereco_detalhe)} legado={c.endereco_detalhe ? null : c.endereco} />
        {!c.endereco_detalhe && c.endereco && <input type="hidden" name="endereco_legado" value={c.endereco} />}
      </FieldGroup>
      <SelectField label="Status fiscal" name="status_fiscal" defaultValue={c.status_fiscal || "regular"}>
        <option value="regular">Regular</option>
        <option value="em_verificacao">Em verificação</option>
        <option value="pendencia">Pendência</option>
      </SelectField>
      <SelectField
        label="Perfil de atuação"
        name="perfil_atuacao"
        defaultValue={c.perfil_atuacao || "proprietario"}
        hint="Define o aviso de nota única de Co-Anfitrião. “Colaborador — admin” move a conta para a equipe (sai de Clientes e passa a aparecer em Usuários)."
      >
        <option value="proprietario">Proprietário</option>
        <option value="coanfitriao">Co-Anfitrião</option>
        <option value="ambos">Proprietário + Co-Anfitrião</option>
        <option value="admin">Colaborador — admin (equipe)</option>
      </SelectField>
      <SelectField
        label="Acesso ao portal"
        name="ativo"
        defaultValue={c.ativo ? "true" : "false"}
        hint="Desativar encerra as sessões abertas do cliente na hora."
      >
        <option value="true">Ativo</option>
        <option value="false">Desativado</option>
      </SelectField>
      <div className="sm:col-span-2">
        <SubmitButton>Salvar alterações</SubmitButton>
      </div>
    </ActionForm>
  );
}
