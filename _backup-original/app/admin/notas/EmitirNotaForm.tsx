"use client";

import { useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { emitirNota, buscarComissaoReferencia } from "./actions";

type Cliente = { id: string; nome: string };
type Imovel = { id: string; nome: string; owner_id: string };

const initialState: { ok?: boolean; erro?: string; rascunho?: boolean } = {};

function BotaoEmitir({ ehComissao }: { ehComissao: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-ocean px-5 py-2.5 text-sm font-medium text-white hover:bg-ocean-deep disabled:opacity-60 sm:col-span-2 sm:w-fit"
    >
      {pending ? "Salvando…" : ehComissao ? "Salvar rascunho" : "Emitir NFS-e"}
    </button>
  );
}

export default function EmitirNotaForm({ clientes, imoveis }: { clientes: Cliente[]; imoveis: Imovel[] }) {
  const [state, formAction] = useFormState(async (_prev: typeof initialState, formData: FormData) => {
    return emitirNota(formData);
  }, initialState);

  const [tipo, setTipo] = useState("hospede");
  const [buscando, setBuscando] = useState(false);
  const [buscaErro, setBuscaErro] = useState("");
  const clienteRef = useRef<HTMLSelectElement>(null);
  const competenciaRef = useRef<HTMLInputElement>(null);
  const valorRef = useRef<HTMLInputElement>(null);
  const descricaoRef = useRef<HTMLInputElement>(null);

  const ehComissao = tipo === "comissao";

  async function handleBuscarReferencia() {
    const clienteId = clienteRef.current?.value || "";
    const competencia = competenciaRef.current?.value || "";
    if (!clienteId || !competencia) {
      setBuscaErro("Selecione o cliente e informe a competência (ex.: 2026-09) antes de buscar.");
      return;
    }
    setBuscaErro("");
    setBuscando(true);
    const resultado = await buscarComissaoReferencia(clienteId, competencia);
    setBuscando(false);
    if (!resultado.ok) {
      setBuscaErro(resultado.erro);
      return;
    }
    if (valorRef.current) valorRef.current.value = String(resultado.valor);
    if (descricaoRef.current) descricaoRef.current.value = resultado.descricao;
  }

  return (
    <form action={formAction} className="mt-8 grid gap-4 rounded-2xl border border-ocean/10 bg-white p-6 sm:grid-cols-2">
      <h2 className="font-display text-lg font-semibold text-ink sm:col-span-2">Emitir nota fiscal</h2>

      <div>
        <label className="mb-1 block text-sm font-medium">Cliente</label>
        <select
          name="cliente_id"
          ref={clienteRef}
          required
          className="w-full rounded-lg border border-ocean/20 px-3 py-2 text-sm"
        >
          <option value="">Selecione…</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Imóvel (opcional)</label>
        <select name="imovel_id" className="w-full rounded-lg border border-ocean/20 px-3 py-2 text-sm">
          <option value="">—</option>
          {imoveis.map((im) => (
            <option key={im.id} value={im.id}>
              {im.nome}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Tipo</label>
        <select
          name="tipo"
          required
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="w-full rounded-lg border border-ocean/20 px-3 py-2 text-sm"
        >
          <option value="hospede">Nota para hóspede (CNPJ do cliente)</option>
          <option value="proprietario">Nota de honorários (Anfitrião → cliente)</option>
          <option value="comissao">Nota de comissão (Co-Anfitrião) — rascunho</option>
        </select>
        {ehComissao && (
          <p className="mt-1 text-xs text-ink-soft">
            Valor de referência = soma da comissão de gestão de todos os imóveis que o cliente administra na
            competência (mesmo número que aparece em Financeiro, no Portal do Cliente). Fica só como rascunho — não
            chama o provedor de NFS-e automaticamente, porque o tomador é agregado.
          </p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Competência {ehComissao ? "" : "(opcional)"}</label>
        <input
          name="competencia"
          ref={competenciaRef}
          required={ehComissao}
          placeholder="2026-09"
          className="w-full rounded-lg border border-ocean/20 px-3 py-2 text-sm"
        />
      </div>

      {ehComissao && (
        <div className="sm:col-span-2">
          <button
            type="button"
            onClick={handleBuscarReferencia}
            disabled={buscando}
            className="rounded-lg border border-ocean/30 px-4 py-2 text-sm font-medium text-ocean hover:bg-ocean/5 disabled:opacity-60"
          >
            {buscando ? "Buscando…" : "Buscar valor de referência e pré-preencher"}
          </button>
          {buscaErro && <p className="mt-1 text-xs text-red-600">{buscaErro}</p>}
        </div>
      )}

      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium">Descrição do serviço</label>
        <input
          name="descricao_servico"
          ref={descricaoRef}
          required
          placeholder="Ex.: Hospedagem — Cobertura Vista Mar, 3 diárias"
          className="w-full rounded-lg border border-ocean/20 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Valor (R$)</label>
        <input
          name="valor"
          ref={valorRef}
          type="number"
          step="0.01"
          min={0}
          required
          className="w-full rounded-lg border border-ocean/20 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Código do serviço (LC 116/2003)</label>
        <input
          name="codigo_servico"
          placeholder="Ex.: 14.01"
          className="w-full rounded-lg border border-ocean/20 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-ink-soft">Varia por prefeitura — confirmar antes de emitir em produção.</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Nome do hóspede (se tipo = hóspede)</label>
        <input name="tomador_nome" className="w-full rounded-lg border border-ocean/20 px-3 py-2 text-sm" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">CPF do hóspede (opcional)</label>
        <input name="tomador_documento" className="w-full rounded-lg border border-ocean/20 px-3 py-2 text-sm" />
      </div>

      {state.erro && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">
          {state.erro}
        </p>
      )}
      {state.ok && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 sm:col-span-2">
          {state.rascunho
            ? "Rascunho salvo — revise e decida manualmente como emitir (ver lista abaixo)."
            : "Enviada ao provedor — acompanhe o status na lista abaixo."}
        </p>
      )}

      <BotaoEmitir ehComissao={ehComissao} />
    </form>
  );
}
