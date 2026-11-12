"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { InputField, SelectField } from "./Field";
import { useFormState } from "./ActionForm";
import { buscarCep } from "@/lib/cep-actions";
import { UFS } from "@/lib/constants";
import { mascaraCep, mascaraIbge, soDigitos } from "@/lib/documentos";
import type { EnderecoDetalhe } from "@/lib/tipos";

export type EnderecoNomes = {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  ibge: string;
};

export type EnderecoValores = Partial<Record<keyof EnderecoNomes, string | null | undefined>>;

/** Converte o endereço estruturado da API nos valores iniciais do bloco. */
export function valoresDeDetalhe(d: EnderecoDetalhe | null | undefined): EnderecoValores {
  return d ? { ...d, ibge: d.codigo_ibge } : {};
}

/** Nomes de campo usados no cadastro de clientes/usuários (lib/validation.ts → enderecoCampos). */
export const NOMES_ENDERECO_PESSOA: EnderecoNomes = {
  cep: "endereco_cep",
  logradouro: "endereco_logradouro",
  numero: "endereco_numero",
  complemento: "endereco_complemento",
  bairro: "endereco_bairro",
  cidade: "endereco_cidade",
  uf: "endereco_uf",
  ibge: "endereco_ibge",
};

type Props = {
  /** Nomes dos inputs enviados no formulário (padrão: cadastro de pessoa). */
  nomes?: Partial<EnderecoNomes>;
  valores?: EnderecoValores | null;
  /** Sem complemento (ex.: imóvel). */
  semComplemento?: boolean;
  /** Código IBGE obrigatório (ex.: prestador de NFS-e). */
  ibgeObrigatorio?: boolean;
  resetOnSuccess?: boolean;
  /** Endereço antigo (texto livre) para mostrar como referência enquanto o novo é preenchido. */
  legado?: string | null;
};

const vazio = (v: string | null | undefined) => v ?? "";

/**
 * Bloco de endereço separado: CEP (com máscara e validação) preenche
 * logradouro, bairro, cidade, UF e código IBGE. O que o CEP não trouxer fica
 * em branco; tudo continua editável. Renderiza só os campos — use dentro de
 * um <FieldGroup> (grid de 2 colunas).
 */
export function EnderecoFields({ nomes, valores, semComplemento, ibgeObrigatorio, resetOnSuccess, legado }: Props) {
  const n: EnderecoNomes = { ...NOMES_ENDERECO_PESSOA, ...nomes };
  const v = valores ?? {};
  const inicial = () => ({
    cep: mascaraCep(vazio(v.cep)),
    logradouro: vazio(v.logradouro),
    numero: vazio(v.numero),
    complemento: vazio(v.complemento),
    bairro: vazio(v.bairro),
    cidade: vazio(v.cidade),
    uf: vazio(v.uf).toUpperCase(),
    ibge: mascaraIbge(vazio(v.ibge)),
  });
  const [f, setF] = useState(inicial);
  const [status, setStatus] = useState<"idle" | "buscando" | "ok" | "erro">("idle");
  const [aviso, setAviso] = useState<string | null>(null);
  const [tocado, setTocado] = useState(false);
  const ultimo = useRef(soDigitos(f.cep));
  const seq = useRef(0);
  const cepRef = useRef<HTMLInputElement>(null);
  const state = useFormState();

  const set = (campo: keyof typeof f, valor: string) => setF((x) => ({ ...x, [campo]: valor }));

  useEffect(() => {
    if (resetOnSuccess && state.ok) {
      const i = inicial();
      setF(i);
      ultimo.current = soDigitos(i.cep);
      setStatus("idle");
      setAviso(null);
      setTocado(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ts]);

  const digitos = soDigitos(f.cep);
  const cepIncompleto = digitos.length > 0 && digitos.length < 8;
  useEffect(() => {
    cepRef.current?.setCustomValidity(cepIncompleto ? "CEP deve ter 8 dígitos" : "");
  }, [cepIncompleto]);

  async function consultar(cep: string) {
    ultimo.current = cep;
    const minha = ++seq.current;
    setStatus("buscando");
    setAviso(null);
    const r = await buscarCep(cep);
    if (minha !== seq.current) return; // chegou resposta de um CEP antigo
    if (!r.ok) {
      setStatus("erro");
      setAviso(r.message);
      return;
    }
    // O que o CEP não trouxe fica em branco (e editável) em vez de manter valor de outro CEP.
    setF((x) => ({ ...x, logradouro: r.logradouro, bairro: r.bairro, cidade: r.cidade, uf: r.uf, ibge: r.ibge }));
    setStatus("ok");
    const faltam = [!r.logradouro && "logradouro", !r.bairro && "bairro", !r.ibge && "código IBGE"].filter(Boolean);
    setAviso(
      faltam.length
        ? `Este CEP não informa ${faltam.join(", ")} — preencha manualmente.`
        : "Endereço preenchido pelo CEP. Confira e ajuste se precisar."
    );
  }

  function onCep(valor: string) {
    const m = mascaraCep(valor);
    set("cep", m);
    setTocado(false);
    const d = soDigitos(m);
    if (d.length === 8 && d !== ultimo.current) void consultar(d);
    if (d.length < 8) {
      ultimo.current = "";
      setStatus("idle");
      setAviso(null);
    }
  }

  const erroCep = tocado && cepIncompleto ? "CEP deve ter 8 dígitos" : undefined;
  const dicaCep = (
    <span aria-live="polite">
      {status === "buscando" ? (
        <span className="inline-flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> Buscando endereço…
        </span>
      ) : (
        (aviso ?? (legado ? `Endereço anterior: ${legado}` : "Digite o CEP para preencher o endereço."))
      )}
    </span>
  );

  return (
    <>
      <InputField
        ref={cepRef}
        label="CEP"
        name={n.cep}
        value={f.cep}
        onChange={(e) => onCep(e.target.value)}
        onBlur={() => setTocado(true)}
        inputMode="numeric"
        autoComplete="postal-code"
        maxLength={9}
        placeholder="00000-000"
        optional
        erroLocal={erroCep}
        hint={dicaCep}
        className="sm:col-span-2"
      />
      <InputField label="Logradouro" name={n.logradouro} value={f.logradouro} onChange={(e) => set("logradouro", e.target.value)} autoComplete="address-line1" maxLength={160} optional className="sm:col-span-2" />
      <InputField label="Número" name={n.numero} value={f.numero} onChange={(e) => set("numero", e.target.value)} maxLength={20} optional />
      {!semComplemento && (
        <InputField label="Complemento" name={n.complemento} value={f.complemento} onChange={(e) => set("complemento", e.target.value)} autoComplete="address-line2" maxLength={100} optional />
      )}
      <InputField label="Bairro" name={n.bairro} value={f.bairro} onChange={(e) => set("bairro", e.target.value)} maxLength={80} optional />
      <InputField label="Cidade" name={n.cidade} value={f.cidade} onChange={(e) => set("cidade", e.target.value)} autoComplete="address-level2" maxLength={80} optional />
      <SelectField label="Estado (UF)" name={n.uf} value={f.uf} onChange={(e) => set("uf", e.target.value)} optional>
        <option value="">Selecione</option>
        {UFS.map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
      </SelectField>
      <InputField
        label="Código IBGE do município"
        name={n.ibge}
        value={f.ibge}
        onChange={(e) => set("ibge", mascaraIbge(e.target.value))}
        inputMode="numeric"
        maxLength={7}
        minLength={ibgeObrigatorio ? 7 : undefined}
        pattern={ibgeObrigatorio ? "\\d{7}" : "(\\d{7})?"}
        title="7 dígitos"
        required={ibgeObrigatorio}
        optional={!ibgeObrigatorio}
        hint={ibgeObrigatorio ? "7 dígitos — é o cLocEmi da DPS." : "7 dígitos (preenchido pelo CEP)."}
      />
    </>
  );
}
