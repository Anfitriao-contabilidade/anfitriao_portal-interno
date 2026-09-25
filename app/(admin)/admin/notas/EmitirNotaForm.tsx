"use client";

import { useMemo, useRef, useState } from "react";
import { Calculator, Loader2, Send } from "lucide-react";
import { ActionForm } from "@/components/forms/ActionForm";
import { InputField, SelectField } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Alert } from "@/components/ui/Alert";
import { buttonClass } from "@/components/ui/Button";
import { buscarComissaoReferencia, emitirNota } from "./actions";

type Cliente = { id: string; nome: string };
type Imovel = { id: string; nome: string; donos: string[] };

export function EmitirNotaForm({ clientes, imoveis }: { clientes: Cliente[]; imoveis: Imovel[] }) {
  const [tipo, setTipo] = useState("hospede");
  const [clienteId, setClienteId] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [buscaErro, setBuscaErro] = useState("");
  const competenciaRef = useRef<HTMLInputElement>(null);
  const valorRef = useRef<HTMLInputElement>(null);
  const descricaoRef = useRef<HTMLInputElement>(null);

  const ehComissao = tipo === "comissao";
  const ehHospede = tipo === "hospede";
  // Só mostra os imóveis do cliente escolhido (evita vincular imóvel de outro cliente).
  const imoveisDoCliente = useMemo(() => imoveis.filter((i) => i.donos.includes(clienteId)), [imoveis, clienteId]);

  async function preencherComissao() {
    const competencia = competenciaRef.current?.value || "";
    if (!clienteId || !competencia) {
      setBuscaErro("Selecione o cliente e informe a competência (ex.: 2026-09).");
      return;
    }
    setBuscaErro("");
    setBuscando(true);
    const r = await buscarComissaoReferencia(clienteId, competencia);
    setBuscando(false);
    if (!r.ok) return setBuscaErro(r.erro);
    if (valorRef.current) valorRef.current.value = r.valor.toFixed(2);
    if (descricaoRef.current) descricaoRef.current.value = r.descricao;
  }

  return (
    <ActionForm action={emitirNota} className="grid gap-4 sm:grid-cols-2">
      <SelectField label="Cliente" name="cliente_id" required value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
        <option value="">Selecione…</option>
        {clientes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nome}
          </option>
        ))}
      </SelectField>
      <SelectField label="Imóvel" name="imovel_id" optional disabled={!clienteId} key={clienteId}>
        <option value="">{clienteId ? "—" : "Escolha o cliente primeiro"}</option>
        {imoveisDoCliente.map((im) => (
          <option key={im.id} value={im.id}>
            {im.nome}
          </option>
        ))}
      </SelectField>

      <SelectField label="Tipo de nota" name="tipo" required value={tipo} onChange={(e) => setTipo(e.target.value)} className="sm:col-span-2">
        <option value="hospede">Para hóspede (CNPJ do cliente)</option>
        <option value="proprietario">Honorários (Anfitrião → cliente)</option>
        <option value="comissao">Comissão de Co-Anfitrião (rascunho)</option>
      </SelectField>

      {ehComissao && (
        <Alert tone="info" className="sm:col-span-2">
          Valor de referência = soma da comissão de gestão de todos os imóveis do cliente na competência (o mesmo número
          do Financeiro dele). Fica como rascunho: o tomador é agregado, então o provedor não é chamado.
        </Alert>
      )}

      <InputField
        ref={competenciaRef}
        label="Competência"
        name="competencia"
        type="month"
        required={ehComissao}
        optional={!ehComissao}
        placeholder="2026-09"
      />
      <InputField ref={valorRef} label="Valor (R$)" name="valor" type="number" inputMode="decimal" step="0.01" min={0.01} required />

      {ehComissao && (
        <div className="sm:col-span-2">
          <button type="button" onClick={preencherComissao} disabled={buscando} className={buttonClass("secondary", "md")}>
            {buscando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Calculator className="h-4 w-4" aria-hidden />}
            {buscando ? "Calculando…" : "Calcular valor de referência"}
          </button>
          {buscaErro && (
            <p role="alert" className="mt-1.5 text-xs font-medium text-red-700">
              {buscaErro}
            </p>
          )}
        </div>
      )}

      <InputField
        ref={descricaoRef}
        label="Descrição do serviço"
        name="descricao_servico"
        required
        maxLength={500}
        placeholder="Ex.: Hospedagem — Vista Mar, 3 diárias"
        className="sm:col-span-2"
      />
      {!ehComissao && (
        <InputField
          label="Código do serviço (LC 116/2003)"
          name="codigo_servico"
          optional
          placeholder="14.01"
          maxLength={6}
          hint="Varia por prefeitura — confirme antes de emitir em produção."
        />
      )}
      {ehHospede && (
        <>
          <InputField label="Nome do hóspede" name="tomador_nome" optional maxLength={160} autoComplete="off" />
          <InputField label="CPF do hóspede" name="tomador_documento" optional inputMode="numeric" maxLength={18} autoComplete="off" />
        </>
      )}

      <div className="sm:col-span-2">
        <SubmitButton pendingLabel={ehComissao ? "Salvando…" : "Emitindo…"}>
          <Send className="h-4 w-4" aria-hidden />
          {ehComissao ? "Salvar rascunho" : "Emitir NFS-e"}
        </SubmitButton>
      </div>
    </ActionForm>
  );
}
