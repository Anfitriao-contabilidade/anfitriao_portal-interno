"use client";

import { useState } from "react";
import { ActionForm } from "@/components/forms/ActionForm";
import { DocumentoField } from "@/components/forms/DocumentoField";
import { EnderecoFields, valoresDeDetalhe } from "@/components/forms/EnderecoFields";
import { FieldGroup, InputField, SelectField } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import type { EnderecoDetalhe } from "@/lib/tipos";
import { atualizarUsuario, gerarLinkSenha } from "./actions";

export type UsuarioEdicao = {
  id: string;
  nome: string;
  tipo: string;
  documento: string;
  telefone: string;
  endereco: string;
  endereco_detalhe?: EnderecoDetalhe | null;
  plano: string;
  status_fiscal: string;
  papel: string;
  ativo: boolean;
  eu: boolean;
  permissoes: string[];
};

const PERMISSOES_NFSE: [string, string][] = [
  ["nfse.emitir", "Emitir NFS-e (rascunhos, tomadores e transmissão)"],
  ["nfse.cancelar", "Cancelar e substituir NFS-e"],
  ["nfse.configurar", "Configurar prestadores e autorizações"],
  ["nfse.producao", "Operar no ambiente de PRODUÇÃO"],
];

export function UsuarioForm({ u }: { u: UsuarioEdicao }) {
  const [tipo, setTipo] = useState<"PF" | "PJ">(u.tipo === "PJ" ? "PJ" : "PF");
  return (
    <div className="grid gap-6">
      <ActionForm action={atualizarUsuario} className="grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="id" value={u.id} />
        <InputField label="Nome" name="nome" defaultValue={u.nome} required maxLength={160} className="sm:col-span-2" />
        {/* Um único campo define o papel: colaborador (admin) OU o perfil de cliente. */}
        <SelectField
          label="Acesso"
          name="papel_acesso"
          defaultValue={u.papel}
          disabled={u.eu}
          hint={u.eu ? "A própria conta permanece Colaborador — admin." : "Colaborador vê o painel da equipe; cliente vê só os próprios imóveis."}
        >
          <option value="admin">Colaborador — admin</option>
          <option value="proprietario">Cliente — proprietário</option>
          <option value="coanfitriao">Cliente — coanfitrião</option>
          <option value="ambos">Cliente — proprietário e coanfitrião</option>
        </SelectField>
        {u.eu && <input type="hidden" name="papel_acesso" value="admin" />}
        <SelectField label="Tipo" name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value === "PJ" ? "PJ" : "PF")}>
          <option value="PF">Pessoa física</option>
          <option value="PJ">Pessoa jurídica</option>
        </SelectField>
        <DocumentoField defaultValue={u.documento} tipo={tipo} optional />
        <InputField label="Telefone" name="telefone" defaultValue={u.telefone} maxLength={25} optional />
        <InputField label="Plano" name="plano" defaultValue={u.plano} maxLength={60} optional />
        <FieldGroup title="Endereço">
          <EnderecoFields valores={valoresDeDetalhe(u.endereco_detalhe)} legado={u.endereco_detalhe ? null : u.endereco} />
          {!u.endereco_detalhe && u.endereco && <input type="hidden" name="endereco_legado" value={u.endereco} />}
        </FieldGroup>
        <SelectField label="Status fiscal" name="status_fiscal" defaultValue={u.status_fiscal || "regular"}>
          <option value="regular">Regular</option>
          <option value="em_verificacao">Em verificação</option>
          <option value="pendencia">Pendência</option>
        </SelectField>
        <SelectField label="Conta" name="ativo" defaultValue={u.ativo ? "true" : "false"} disabled={u.eu}>
          <option value="true">Ativa</option>
          <option value="false">Desativada</option>
        </SelectField>
        {u.eu && <input type="hidden" name="ativo" value="true" />}
        {u.papel === "admin" && (
          <fieldset className="grid gap-2 sm:col-span-2">
            <legend className="mb-1 font-mono text-[.7rem] font-semibold uppercase tracking-[.12em] text-ink-soft">
              Permissões fiscais (NFS-e) — consulta é liberada a toda a equipe
            </legend>
            <input type="hidden" name="permissoes_enviadas" value="1" />
            {PERMISSOES_NFSE.map(([v, l]) => (
              <label key={v} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="permissoes" value={v} defaultChecked={u.permissoes.includes(v)} /> {l}
              </label>
            ))}
          </fieldset>
        )}
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
