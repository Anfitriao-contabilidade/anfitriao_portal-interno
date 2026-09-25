"use client";

import { useState } from "react";
import { ActionForm } from "@/components/forms/ActionForm";
import { InputField, TextareaField } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { buttonClass } from "@/components/ui/Button";
import { atualizarPlano, criarPlano, removerPlano, salvarSecaoPlanos } from "./actions";

export type Plano = {
  id: string;
  ordem: number;
  nivel: string;
  titulo: string;
  descricao: string;
  mais_escolhido: boolean;
  tag_oferta: string | null;
  preco_oficial: string;
  preco_atual: string;
  beneficios: string[];
  faturamento: string;
  botao: string;
};

export type Secao = { eyebrow: string; titulo: string; subtitulo: string; nota: string };

function reais(valor: string) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return valor;
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Beneficios({ iniciais }: { iniciais: string[] }) {
  const [itens, setItens] = useState(iniciais.length ? iniciais : [""]);
  return (
    <fieldset className="sm:col-span-2">
      <legend className="mb-2 text-sm font-medium text-ink">Benefícios</legend>
      <ul className="flex flex-col gap-2">
        {itens.map((item, i) => (
          <li key={i} className="flex gap-2">
            <input
              name="beneficios"
              value={item}
              onChange={(e) => setItens(itens.map((atual, idx) => (idx === i ? e.target.value : atual)))}
              className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm"
              placeholder="Benefício"
            />
            <button type="button" className="w-9 text-ink-soft hover:text-danger" aria-label="Remover benefício" onClick={() => setItens(itens.filter((_, idx) => idx !== i))}>
              ×
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className={`${buttonClass("ghost", "sm")} mt-2`} onClick={() => setItens([...itens, ""])}>
        + Adicionar benefício
      </button>
    </fieldset>
  );
}

function Campos({ plano }: { plano?: Plano }) {
  return (
    <>
      {plano && <input type="hidden" name="id" value={plano.id} />}
      <InputField label="Ordem" name="ordem" inputMode="numeric" required defaultValue={plano ? String(plano.ordem) : "4"} />
      <InputField label="Nível" name="nivel" required defaultValue={plano?.nivel} placeholder="Nível 01" />
      <InputField label="Título" name="titulo" required defaultValue={plano?.titulo} className="sm:col-span-2" />
      <TextareaField label="Descrição" name="descricao" required defaultValue={plano?.descricao} rows={2} className="sm:col-span-2" />
      <InputField label="Tag de oferta" name="tag_oferta" optional defaultValue={plano?.tag_oferta ?? "De"} hint="Ex.: De. Em branco, a tag some." />
      <label className="flex items-center gap-2 self-end text-sm font-medium text-ink">
        <input type="checkbox" name="mais_escolhido" defaultChecked={plano?.mais_escolhido} />
        Tag Mais escolhido
      </label>
      <InputField label="Preço oficial (riscado)" name="preco_oficial" inputMode="decimal" required defaultValue={plano ? reais(plano.preco_oficial) : ""} />
      <InputField label="Preço atual" name="preco_atual" inputMode="decimal" required defaultValue={plano ? reais(plano.preco_atual) : ""} hint="Valor cobrado por mês." />
      <Beneficios iniciais={plano?.beneficios ?? [""]} />
      <InputField label="Faixa de faturamento" name="faturamento" required defaultValue={plano?.faturamento} className="sm:col-span-2" />
      <InputField label="Texto do botão" name="botao" required defaultValue={plano?.botao ?? "Escolher"} />
    </>
  );
}

export function SecaoForm({ secao }: { secao: Secao }) {
  return (
    <ActionForm action={salvarSecaoPlanos} className="grid gap-4">
      <InputField label="Texto curto" name="eyebrow" required defaultValue={secao.eyebrow} />
      <InputField label="Título da seção" name="titulo" required defaultValue={secao.titulo} />
      <TextareaField label="Subtítulo" name="subtitulo" required defaultValue={secao.subtitulo} rows={2} />
      <TextareaField label="Nota do rodapé" name="nota" required defaultValue={secao.nota} rows={2} />
      <SubmitButton>Salvar textos</SubmitButton>
    </ActionForm>
  );
}

export function NovoPlanoForm() {
  return (
    <ActionForm action={criarPlano} className="grid gap-4 sm:grid-cols-2" resetOnSuccess>
      <Campos />
      <div className="sm:col-span-2">
        <SubmitButton>Criar plano</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function PlanoForm({ plano }: { plano: Plano }) {
  return (
    <div className="flex flex-col gap-4">
      <ActionForm action={atualizarPlano} className="grid gap-4 sm:grid-cols-2">
        <Campos plano={plano} />
        <div className="sm:col-span-2">
          <SubmitButton>Salvar plano</SubmitButton>
        </div>
      </ActionForm>
      <ActionForm action={removerPlano}>
        <input type="hidden" name="id" value={plano.id} />
        <SubmitButton variant="danger">Excluir plano</SubmitButton>
      </ActionForm>
    </div>
  );
}
