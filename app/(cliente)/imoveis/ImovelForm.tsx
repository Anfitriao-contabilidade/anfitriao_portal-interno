"use client";

import { ActionForm } from "@/components/forms/ActionForm";
import { useState } from "react";
import { FieldGroup, InputField, SelectField } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { CONDICOES_IMOVEL, TIPOS_IMOVEL, UFS } from "@/lib/constants";
import type { ActionState } from "@/lib/actions";

export type ImovelDados = {
  id?: string;
  nome?: string;
  taxa_gestao_pct?: number;
  plataformas?: string[] | null;
  tipo?: string | null;
  condicao?: string | null;
  metragem?: number | null;
  quartos?: number | null;
  salas?: number | null;
  banheiros?: number | null;
  cep?: string | null;
  rua?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
};

export function ImovelForm({
  action,
  imovel,
  submitLabel,
  taxaEditavel = true,
  terceiro = "nao",
  proprietarios,
}: {
  action: (s: ActionState, f: FormData) => Promise<ActionState>;
  imovel?: ImovelDados;
  submitLabel: string;
  /** false para co-anfitrião de imóvel com proprietário cadastrado (a API não deixa alterar). */
  taxaEditavel?: boolean;
  /** Cadastro de imóvel de proprietário sem conta: "obrigatorio" (só co-anfitrião) ou "opcional" (ambos). */
  terceiro?: "nao" | "opcional" | "obrigatorio";
  /** Somente equipe: clientes proprietários para escolher como dono do imóvel. */
  proprietarios?: { id: string; nome: string }[];
}) {
  const im = imovel ?? {};
  const [deTerceiro, setDeTerceiro] = useState(terceiro === "obrigatorio");
  return (
    <ActionForm action={action} className="grid gap-5 sm:grid-cols-2" resetOnSuccess={!im.id}>
      {im.id && <input type="hidden" name="id" value={im.id} />}

      <FieldGroup title="Identificação">
        <InputField label="Nome do imóvel" name="nome" defaultValue={im.nome ?? ""} required maxLength={120} placeholder="Ex.: Vista Mar 302" />
        <InputField
          label="Taxa de gestão (%)"
          name="taxa_gestao_pct"
          type="number"
          inputMode="decimal"
          step="0.5"
          min={0}
          max={100}
          defaultValue={im.taxa_gestao_pct ?? 18}
          disabled={!taxaEditavel}
          hint={taxaEditavel ? "Percentual cobrado sobre as reservas." : "Definida pelo proprietário do imóvel."}
        />
        <InputField
          label="Plataformas"
          name="plataformas"
          defaultValue={im.plataformas?.join(", ") ?? ""}
          placeholder="airbnb, booking"
          maxLength={300}
          optional
          hint="Separe por vírgula."
          className="sm:col-span-2"
        />
      </FieldGroup>

      {terceiro !== "nao" && (
        <FieldGroup title="Proprietário">
          {terceiro === "opcional" ? (
            <label className="flex min-h-11 items-center gap-2 text-sm text-ink sm:col-span-2">
              <input
                type="checkbox"
                name="de_terceiro"
                checked={deTerceiro}
                onChange={(e) => setDeTerceiro(e.target.checked)}
                className="h-4 w-4 rounded border-line text-ocean"
              />
              Administro este imóvel para outra pessoa (proprietário sem conta no portal)
            </label>
          ) : (
            <p className="text-sm text-ink-soft sm:col-span-2">
              Como Co-Anfitrião, informe quem é o proprietário do imóvel que você administra.
            </p>
          )}
          {proprietarios && !deTerceiro && (
            <SelectField label="Proprietário (cliente)" name="proprietario_id" required className="sm:col-span-2">
              <option value="">Selecione…</option>
              {proprietarios.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </SelectField>
          )}
          {deTerceiro && (
            <>
              <InputField label="Nome do proprietário" name="prop_nome" required maxLength={200} className="sm:col-span-2" />
              <InputField label="CPF / CNPJ do proprietário" name="prop_documento" inputMode="numeric" maxLength={18} optional />
              <InputField label="E-mail do proprietário" name="prop_email" type="email" maxLength={254} optional />
              <InputField label="Telefone do proprietário" name="prop_telefone" type="tel" inputMode="tel" maxLength={25} optional />
            </>
          )}
        </FieldGroup>
      )}

      <FieldGroup title="Endereço">
        <InputField label="CEP" name="cep" defaultValue={im.cep ?? ""} inputMode="numeric" autoComplete="postal-code" maxLength={9} optional placeholder="00000-000" />
        <InputField label="Rua / Avenida" name="rua" defaultValue={im.rua ?? ""} autoComplete="address-line1" maxLength={160} optional />
        <InputField label="Número" name="numero" defaultValue={im.numero ?? ""} maxLength={20} optional />
        <InputField label="Bairro" name="bairro" defaultValue={im.bairro ?? ""} maxLength={80} optional />
        <InputField label="Cidade" name="cidade" defaultValue={im.cidade ?? ""} autoComplete="address-level2" maxLength={80} optional />
        <SelectField label="UF" name="uf" defaultValue={im.uf ?? ""} optional>
          <option value="">Selecione</option>
          {UFS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </SelectField>
      </FieldGroup>

      <FieldGroup title="Detalhes">
        <SelectField label="Tipo" name="tipo" defaultValue={im.tipo ?? ""} optional>
          <option value="">Selecione</option>
          {TIPOS_IMOVEL.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </SelectField>
        <SelectField label="Estado de conservação" name="condicao" defaultValue={im.condicao ?? ""} optional>
          <option value="">Selecione</option>
          {CONDICOES_IMOVEL.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </SelectField>
        <div className="grid grid-cols-2 gap-4 sm:col-span-2 sm:grid-cols-4">
          <InputField label="Metragem (m²)" name="metragem" type="number" inputMode="decimal" min={0} step="1" defaultValue={im.metragem ?? ""} />
          <InputField label="Quartos" name="quartos" type="number" inputMode="numeric" min={0} max={50} step="1" defaultValue={im.quartos ?? ""} />
          <InputField label="Salas" name="salas" type="number" inputMode="numeric" min={0} max={50} step="1" defaultValue={im.salas ?? ""} />
          <InputField label="Banheiros" name="banheiros" type="number" inputMode="numeric" min={0} max={50} step="1" defaultValue={im.banheiros ?? ""} />
        </div>
      </FieldGroup>

      <div className="sm:col-span-2">
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </ActionForm>
  );
}
