"use client";

import { ActionForm } from "@/components/forms/ActionForm";
import { InputField, SelectField } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { atualizarUsuario, gerarLinkSenha } from "./actions";

export type UsuarioEdicao = {
  id: string;
  nome: string;
  tipo: string;
  documento: string;
  telefone: string;
  endereco: string;
  plano: string;
  status_fiscal: string;
  papel: string;
  ativo: boolean;
  eu: boolean;
};

export function UsuarioForm({ u }: { u: UsuarioEdicao }) {
  return (
    <div className="grid gap-6">
      <ActionForm action={atualizarUsuario} className="grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="id" value={u.id} />
        <InputField label="Nome" name="nome" defaultValue={u.nome} required maxLength={160} className="sm:col-span-2" />
        <SelectField label="Tipo" name="tipo" defaultValue={u.tipo || "PF"}>
          <option value="PF">Pessoa física</option>
          <option value="PJ">Pessoa jurídica</option>
        </SelectField>
        <InputField label="CPF / CNPJ" name="documento" defaultValue={u.documento} maxLength={18} optional />
        <InputField label="Telefone" name="telefone" defaultValue={u.telefone} maxLength={25} optional />
        <InputField label="Plano" name="plano" defaultValue={u.plano} maxLength={60} optional />
        <InputField label="Endereço" name="endereco" defaultValue={u.endereco} maxLength={300} optional className="sm:col-span-2" />
        <SelectField label="Status fiscal" name="status_fiscal" defaultValue={u.status_fiscal || "regular"}>
          <option value="regular">Regular</option>
          <option value="em_verificacao">Em verificação</option>
          <option value="pendencia">Pendência</option>
        </SelectField>
        <SelectField label="Perfil de atuação" name="perfil_atuacao" defaultValue={u.papel === "admin" ? "proprietario" : u.papel}>
          <option value="proprietario">Proprietário</option>
          <option value="coanfitriao">Coanfitrião</option>
          <option value="ambos">Proprietário + coanfitrião</option>
        </SelectField>
        <SelectField label="Acesso" name="papel_acesso" defaultValue={u.papel} hint={u.eu ? "A própria conta permanece admin e ativa." : undefined}>
          <option value="proprietario">Cliente — proprietário</option>
          <option value="coanfitriao">Cliente — coanfitrião</option>
          <option value="ambos">Cliente — os dois</option>
          <option value="admin">Colaborador — admin</option>
        </SelectField>
        <SelectField label="Conta" name="ativo" defaultValue={u.ativo ? "true" : "false"} disabled={u.eu}>
          <option value="true">Ativa</option>
          <option value="false">Desativada</option>
        </SelectField>
        {u.eu && <input type="hidden" name="ativo" value="true" />}
        <div className="sm:col-span-2">
          <SubmitButton>Salvar</SubmitButton>
        </div>
      </ActionForm>
      <ActionForm action={gerarLinkSenha}>
        <input type="hidden" name="id" value={u.id} />
        <SubmitButton variant="secondary" size="sm">Gerar link de senha</SubmitButton>
      </ActionForm>
    </div>
  );
}
