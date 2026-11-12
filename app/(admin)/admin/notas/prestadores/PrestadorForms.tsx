"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ActionForm, useFormState } from "@/components/forms/ActionForm";
import { DocumentoField } from "@/components/forms/DocumentoField";
import { EnderecoFields } from "@/components/forms/EnderecoFields";
import { FieldGroup, InputField, SelectField, TextareaField } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import type { Prestador } from "@/lib/nfse";
import { atualizarPrestador, consultarConvenio, criarPrestador, registrarAutorizacao, revogarAutorizacao } from "../nfse-actions";

type Opcoes = Record<string, Record<string, string>>;
type Cliente = { id: string; nome: string; documento: string | null };

function IrPara() {
  const state = useFormState();
  const router = useRouter();
  useEffect(() => {
    const id = state.ok ? (state.resultado?.id as string | undefined) : undefined;
    if (id) router.push(`/admin/notas/prestadores/${id}`);
  }, [state, router]);
  return null;
}

function opcoes(m: Record<string, string> | undefined) {
  return Object.entries(m ?? {}).map(([v, l]) => (
    <option key={v} value={v}>
      {v} — {l}
    </option>
  ));
}

function CamposFiscais({ p, op }: { p?: Prestador; op: Opcoes }) {
  const [simples, setSimples] = useState(p?.optante_simples ?? "1");
  return (
    <>
      <InputField label="Razão social / nome" name="razao_social" required maxLength={300} defaultValue={p?.razao_social} className="sm:col-span-2" />
      <InputField label="Nome fantasia" name="nome_fantasia" optional maxLength={150} defaultValue={p?.nome_fantasia ?? ""} />
      <InputField label="Inscrição municipal" name="inscricao_municipal" optional maxLength={15} defaultValue={p?.inscricao_municipal ?? ""} />
      <InputField label="Telefone" name="telefone" optional inputMode="tel" defaultValue={p?.telefone ?? ""} />
      <InputField label="E-mail" name="email" type="email" optional defaultValue={p?.email ?? ""} className="sm:col-span-2" />
      <FieldGroup title="Regime tributário">
        <SelectField label="Simples Nacional" name="optante_simples" required value={simples} onChange={(e) => setSimples(e.target.value)}>
          {opcoes(op.optante_simples)}
        </SelectField>
        {simples === "3" && (
          <SelectField label="Regime de apuração (SN)" name="regime_apuracao_sn" required defaultValue={p?.regime_apuracao_sn ?? "1"}>
            {opcoes(op.regime_apuracao_sn)}
          </SelectField>
        )}
        <SelectField label="Regime especial de tributação" name="regime_especial" required defaultValue={p?.regime_especial ?? "0"}>
          {opcoes(op.regime_especial)}
        </SelectField>
      </FieldGroup>
      <FieldGroup title="Numeração da DPS">
        <InputField label="Série" name="serie_dps" required inputMode="numeric" maxLength={5} defaultValue={p?.serie_dps ?? ""} hint="Use uma série exclusiva deste sistema (não compartilhe com o emissor web)." />
        <InputField label="Próximo número" name="proximo_numero_dps" type="number" min={1} defaultValue={p?.proximo_numero_dps ?? 1} hint="Só ajuste se já houver DPS emitidas nesta série." />
      </FieldGroup>
      <FieldGroup title="Endereço e município">
        <EnderecoFields
          nomes={{ cep: "cep", logradouro: "logradouro", numero: "numero", complemento: "complemento", bairro: "bairro", cidade: "municipio_nome", uf: "uf", ibge: "codigo_municipio" }}
          valores={{
            cep: p?.endereco?.cep,
            logradouro: p?.endereco?.logradouro,
            numero: p?.endereco?.numero,
            complemento: p?.endereco?.complemento,
            bairro: p?.endereco?.bairro,
            cidade: p?.municipio_nome,
            uf: p?.uf,
            ibge: p?.codigo_municipio,
          }}
          ibgeObrigatorio
        />
        <p className="text-xs text-ink-soft sm:col-span-2">
          O código IBGE do município é obrigatório (cLocEmi da DPS). Logradouro, número e bairro só são enviados se os três estiverem preenchidos.
        </p>
        <label className="flex items-center gap-2 self-end text-sm">
          <input type="checkbox" name="informar_nome_endereco" defaultChecked={p?.informar_nome_endereco} /> Informar nome e endereço do prestador na DPS
        </label>
      </FieldGroup>
      <FieldGroup title="Ambientes">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked readOnly disabled /> Homologação (Produção Restrita)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="producao" defaultChecked={p?.ambientes_habilitados.includes("producao")} /> Produção — somente após validar em homologação
        </label>
      </FieldGroup>
    </>
  );
}

export function NovoPrestadorForm({ op, clientes, temPropria }: { op: Opcoes; clientes: Cliente[]; temPropria: boolean }) {
  const [tipo, setTipo] = useState(temPropria ? "cliente" : "propria");
  return (
    <ActionForm action={criarPrestador} className="grid gap-4 sm:grid-cols-2">
      <IrPara />
      <SelectField label="Tipo" name="tipo" required value={tipo} onChange={(e) => setTipo(e.target.value)}>
        {!temPropria && <option value="propria">Nossa empresa (Anfitrião)</option>}
        <option value="cliente">Empresa cliente (emissão em nome dele)</option>
      </SelectField>
      {tipo === "cliente" ? (
        <SelectField label="Cliente da plataforma" name="usuario_uid" required hint="O certificado A1 usado será o cadastrado para este cliente.">
          <option value="">Selecione…</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </SelectField>
      ) : (
        <p className="self-end text-xs text-ink-soft">O certificado da própria empresa é cadastrado em Certificados → “empresa-propria”.</p>
      )}
      <DocumentoField label="CPF/CNPJ do prestador" required hint="Imutável depois do cadastro (define o Id da DPS e o certificado exigido)." />
      <CamposFiscais op={op} />
      <div className="sm:col-span-2">
        <SubmitButton pendingLabel="Cadastrando…">Cadastrar prestador</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function EditarPrestadorForm({ p, op }: { p: Prestador; op: Opcoes }) {
  return (
    <ActionForm action={atualizarPrestador} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="id" value={p.id} />
      <CamposFiscais p={p} op={op} />
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" name="ativo" defaultChecked={p.ativo} /> Prestador ativo
      </label>
      <div className="sm:col-span-2">
        <SubmitButton pendingLabel="Salvando…">Salvar alterações</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function AutorizacaoForm({ id }: { id: string }) {
  return (
    <ActionForm action={registrarAutorizacao} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="id" value={id} />
      <SelectField label="Documento" name="tipo_documento" required defaultValue="procuracao">
        <option value="procuracao">Procuração</option>
        <option value="contrato_prestacao_servicos">Contrato de prestação de serviços</option>
        <option value="termo_autorizacao">Termo de autorização</option>
      </SelectField>
      <InputField label="Referência" name="referencia" required minLength={3} maxLength={200} hint="Nº/identificação do documento arquivado." />
      <InputField label="Válido de" name="valido_de" type="date" required />
      <InputField label="Válido até" name="valido_ate" type="date" optional />
      <TextareaField label="Observação" name="observacao" optional rows={2} maxLength={500} className="sm:col-span-2" />
      <label className="flex items-start gap-2 text-sm sm:col-span-2">
        <input type="checkbox" name="confirmar" required className="mt-1" /> Conferi o documento e ele está arquivado. Ele autoriza a Anfitrião a emitir NFS-e em nome deste cliente.
      </label>
      <div className="sm:col-span-2">
        <SubmitButton pendingLabel="Registrando…">Registrar autorização</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function RevogarAutorizacaoButton({ id }: { id: string }) {
  return (
    <ActionForm action={revogarAutorizacao}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton variant="danger" size="sm" pendingLabel="Revogando…">
        Revogar autorização
      </SubmitButton>
    </ActionForm>
  );
}

function ResultadoConvenio() {
  const state = useFormState();
  const dados = state.ok ? (state.resultado?.dados as Record<string, unknown> | undefined) : undefined;
  if (!dados) return null;
  return (
    <dl className="mt-2 grid gap-1 text-xs">
      {Object.entries(dados).map(([k, v]) => (
        <div key={k} className="flex justify-between gap-3">
          <dt className="text-ink-soft">{k}</dt>
          <dd className="font-mono">{String(v)}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ConvenioButton({ id }: { id: string }) {
  return (
    <ActionForm action={consultarConvenio}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton variant="secondary" size="sm" pendingLabel="Consultando…">
        Consultar parâmetros do município
      </SubmitButton>
      <ResultadoConvenio />
    </ActionForm>
  );
}
