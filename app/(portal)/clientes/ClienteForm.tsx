"use client";

import { ActionForm } from "@/components/forms/ActionForm";
import { InputField, SelectField } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { atualizarCliente } from "./actions";

export type ClienteDados = {
  id: string;
  nome: string;
  tipo: string;
  documento: string;
  telefone: string;
  endereco: string;
  plano: string;
  status_fiscal: string;
  perfil_atuacao: string;
  ativo: boolean;
};

export function ClienteForm({ c }: { c: ClienteDados }) {
  return (
    <ActionForm action={atualizarCliente} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="id" value={c.id} />
      <InputField label="Nome / Razão social" name="nome" defaultValue={c.nome} required maxLength={160} className="sm:col-span-2" />
      <SelectField label="Tipo" name="tipo" defaultValue={c.tipo || "PF"}>
        <option value="PF">Pessoa Física</option>
        <option value="PJ">Pessoa Jurídica</option>
      </SelectField>
      <InputField label="CPF / CNPJ" name="documento" defaultValue={c.documento} inputMode="numeric" maxLength={18} optional />
      <InputField label="Telefone" name="telefone" type="tel" defaultValue={c.telefone} inputMode="tel" maxLength={25} optional />
      <InputField label="Plano" name="plano" defaultValue={c.plano} maxLength={60} optional placeholder="Básico, Padrão, Experts Essencial…" />
      <InputField label="Endereço" name="endereco" defaultValue={c.endereco} maxLength={300} optional className="sm:col-span-2" />
      <SelectField label="Status fiscal" name="status_fiscal" defaultValue={c.status_fiscal || "regular"}>
        <option value="regular">Regular</option>
        <option value="em_verificacao">Em verificação</option>
        <option value="pendencia">Pendência</option>
      </SelectField>
      <SelectField
        label="Perfil de atuação"
        name="perfil_atuacao"
        defaultValue={c.perfil_atuacao || "proprietario"}
        hint="Define o aviso de nota única de Co-Anfitrião no Início/Financeiro."
      >
        <option value="proprietario">Proprietário</option>
        <option value="coanfitriao">Co-Anfitrião</option>
        <option value="ambos">Proprietário + Co-Anfitrião</option>
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
