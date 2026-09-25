"use client";

import { useEffect, useState } from "react";
import { buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { calcularPrecificacao, type LinhaCusto, type PrecificacaoResultado } from "../actions";

type Linha = LinhaCusto & { id: string };

const EXEMPLO_FIXOS: LinhaCusto[] = [
  { nome: "Condomínio", valor: "450" },
  { nome: "IPTU (rateio mensal)", valor: "120" },
  { nome: "Internet / TV / Streaming", valor: "150" },
  { nome: "Seguro do imóvel e conteúdo", valor: "60" },
  { nome: "Manutenção preventiva (reserva mensal)", valor: "150" },
  { nome: "Depreciação de mobília e eletros", valor: "200" },
];
const EXEMPLO_VARIAVEIS: LinhaCusto[] = [
  { nome: "Limpeza e enxoval", valor: "90" },
  { nome: "Amenities e consumíveis", valor: "25" },
  { nome: "Água/energia extra (por hóspede)", valor: "20" },
];
const EXEMPLO_PERCENTUAIS: LinhaCusto[] = [
  { nome: "Taxa da plataforma (Airbnb/Booking)", valor: "15" },
  { nome: "Comissão de gestão", valor: "18" },
];

let seq = 0;
function comId(itens: LinhaCusto[]): Linha[] {
  return itens.map((item) => ({ ...item, id: `c${seq++}` }));
}

function brl(valor: string | null | undefined) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function pct(valor: string | null | undefined, casas = 1) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas })}%`;
}

function noites(valor: string | null | undefined) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return "—";
  return Number.isInteger(n) ? String(n) : n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

export function PrecificacaoPainel() {
  const [nome, setNome] = useState("");
  const [fixos, setFixos] = useState<Linha[]>(() => comId(EXEMPLO_FIXOS));
  const [variaveis, setVariaveis] = useState<Linha[]>(() => comId(EXEMPLO_VARIAVEIS));
  const [percentuais, setPercentuais] = useState<Linha[]>(() => comId(EXEMPLO_PERCENTUAIS));
  const [ocupacao, setOcupacao] = useState("60");
  const [margem, setMargem] = useState("20");
  const [praticada, setPraticada] = useState("");
  const [resultado, setResultado] = useState<PrecificacaoResultado | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      void calcularPrecificacao({
        fixos,
        variaveis,
        percentuais,
        ocupacao_pct: ocupacao,
        margem_pct: margem,
        diaria_praticada: praticada,
      }).then((r) => {
        if (r.ok) {
          setResultado(r.resultado);
          setErro("");
        } else {
          setErro(r.message);
        }
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [fixos, variaveis, percentuais, ocupacao, margem, praticada]);

  function restaurar() {
    setNome("");
    setFixos(comId(EXEMPLO_FIXOS));
    setVariaveis(comId(EXEMPLO_VARIAVEIS));
    setPercentuais(comId(EXEMPLO_PERCENTUAIS));
    setOcupacao("60");
    setMargem("20");
    setPraticada("");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <style>{`@media print { body * { visibility: hidden !important; } #relatorio-precificacao, #relatorio-precificacao * { visibility: visible !important; } #relatorio-precificacao { position: absolute; left: 0; top: 0; width: 100%; } }`}</style>
      <div className="flex flex-col gap-4 print:hidden">
        <Card>
          <p className="text-sm leading-relaxed text-ink-soft">
            Antes de escolher o preço da diária, lance o custo real do imóvel — inclusive parado, sem hóspede. Os valores são desta simulação e não alteram o cadastro de imóveis.
          </p>
          <label className="mt-4 block text-sm font-medium text-ink">
            Nome do imóvel / cliente
            <span className="ml-2 text-xs font-normal text-ink-soft">opcional</span>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: AP 402 - Cristo"
              className="mt-1.5 block w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm"
            />
          </label>
        </Card>
        <Lista titulo="1 · Custos fixos mensais" nota="Existem mesmo com o imóvel vazio o mês inteiro." unidade="R$ / mês" linhas={fixos} onChange={setFixos} />
        <Lista titulo="2 · Custos variáveis por diária ocupada" nota="Só acontecem quando há hóspede." unidade="R$ / diária" linhas={variaveis} onChange={setVariaveis} />
        <Lista titulo="3 · Custos percentuais sobre a diária" nota="Taxa da plataforma e comissão, calculados sobre o valor cobrado." unidade="%" linhas={percentuais} onChange={setPercentuais} />
        <Card>
          <h2 className="font-display text-lg font-semibold text-ink">4 · Ocupação e meta de preço</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Campo label="Ocupação média esperada (%)" value={ocupacao} onChange={setOcupacao} />
            <Campo label="Margem de lucro desejada (%)" value={margem} onChange={setMargem} />
            <Campo label="Diária praticada (R$, opcional)" value={praticada} onChange={setPraticada} placeholder="Ex.: 220" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className={buttonClass("secondary", "sm")} onClick={restaurar}>Restaurar exemplo</button>
            <button type="button" className={buttonClass("primary", "sm")} onClick={() => window.print()}>Baixar PDF</button>
          </div>
        </Card>
      </div>
      <Card id="relatorio-precificacao">
        <Relatorio nome={nome} resultado={resultado} erro={erro} praticada={praticada} />
      </Card>
    </div>
  );
}

function Campo({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block text-sm font-medium text-ink">
      {label}
      <input value={value} placeholder={placeholder} inputMode="decimal" onChange={(e) => onChange(e.target.value)} className="mt-1.5 block w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm" />
    </label>
  );
}

function Lista({ titulo, nota, unidade, linhas, onChange }: { titulo: string; nota: string; unidade: string; linhas: Linha[]; onChange: (linhas: Linha[]) => void }) {
  function atualizar(id: string, patch: Partial<LinhaCusto>) {
    onChange(linhas.map((linha) => (linha.id === id ? { ...linha, ...patch } : linha)));
  }
  return (
    <Card>
      <h2 className="font-display text-lg font-semibold text-ink">{titulo}</h2>
      <p className="mt-1 text-sm text-ink-soft">{nota}</p>
      <div className="mt-3 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-ink-soft">
        <span>Custo</span>
        <span className="pr-10">{unidade}</span>
      </div>
      <ul className="mt-2 flex flex-col gap-2">
        {linhas.map((linha) => (
          <li key={linha.id} className="flex gap-2">
            <input value={linha.nome} aria-label="Nome do custo" onChange={(e) => atualizar(linha.id, { nome: e.target.value })} className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm" />
            <input value={linha.valor} aria-label={unidade} inputMode="decimal" onChange={(e) => atualizar(linha.id, { valor: e.target.value })} className="w-28 rounded-lg border border-line bg-white px-3 py-2 text-right text-sm" />
            <button type="button" aria-label={`Remover ${linha.nome || "custo"}`} className="w-9 text-ink-soft hover:text-danger" onClick={() => onChange(linhas.filter((item) => item.id !== linha.id))}>×</button>
          </li>
        ))}
      </ul>
      <button type="button" className={`${buttonClass("ghost", "sm")} mt-3`} onClick={() => onChange([...linhas, { id: `c${seq++}`, nome: "", valor: "" }])}>
        + Adicionar
      </button>
    </Card>
  );
}

function Relatorio({ nome, resultado, erro, praticada }: { nome: string; resultado: PrecificacaoResultado | null; erro: string; praticada: string }) {
  if (!resultado) {
    return <p className="text-sm text-ink-soft">{erro || "Calculando o custo da diária…"}</p>;
  }
  const comparacao =
    resultado.comparacao === "abaixo"
      ? `A diária praticada de ${brl(praticada.replace(",", "."))} fica abaixo da mínima: cada reserva dá prejuízo.`
      : resultado.comparacao === "acima"
        ? `A diária praticada de ${brl(praticada.replace(",", "."))} fica acima da mínima.`
        : resultado.comparacao === "igual"
          ? "A diária praticada é igual à mínima: cobre o custo, sem margem."
          : null;
  return (
    <div>
      {nome && <p className="text-sm font-medium text-ink">{nome}</p>}
      <h2 className="font-display text-xl font-semibold text-ink">Ponto de equilíbrio deste imóvel</h2>
      {resultado.motivo && <p className="mt-3 text-sm text-danger">{resultado.motivo}</p>}
      {resultado.diaria_minima && (
        <p className="mt-4 text-sm leading-relaxed text-ink">
          Diária mínima para não ter prejuízo: <strong>{brl(resultado.diaria_minima)}</strong>. Considerando {pct(resultado.ocupacao_pct)} de ocupação, esse imóvel custa {brl(resultado.custo_vazio_dia)} por dia só para existir vazio, e {brl(resultado.custo_mensal)} por mês somando custos fixos e variáveis na ocupação informada.
          {resultado.diaria_recomendada && <> Com a margem desejada, a diária recomendada é <strong>{brl(resultado.diaria_recomendada)}</strong>.</>}
        </p>
      )}
      {comparacao && <p className="mt-3 text-sm text-ink">{comparacao}</p>}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Destaque valor={brl(resultado.custo_vazio_dia)} rotulo="Custo p/ manter vazio (dia)" nota="só os custos fixos, sem hóspede" />
        <Destaque valor={brl(resultado.diaria_minima)} rotulo="Diária mínima" nota={`na ocupação de ${pct(resultado.ocupacao_pct)} informada`} />
        <Destaque valor={brl(resultado.diaria_recomendada)} rotulo="Diária recomendada" nota={`com margem de ${pct(resultado.margem_pct)} desejada`} />
        <Destaque valor={brl(resultado.custo_mensal)} rotulo="Custo mensal estimado" nota="fixo + variável, na ocupação informada" />
      </div>
      <dl className="mt-5 divide-y divide-line text-sm">
        <Linha rotulo="Custo fixo mensal total" valor={brl(resultado.custo_fixo_mensal)} />
        <Linha rotulo="Custo fixo por dia — imóvel vazio" valor={brl(resultado.custo_vazio_dia)} />
        <Linha rotulo="Ocupação média informada" valor={pct(resultado.ocupacao_pct)} />
        <Linha rotulo="Noites ocupadas estimadas / mês" valor={noites(resultado.noites)} />
        <Linha rotulo="Custo fixo rateado por diária ocupada" valor={brl(resultado.fixo_por_diaria)} />
        <Linha rotulo="Custo variável por diária ocupada" valor={brl(resultado.custo_variavel_diaria)} />
        <Linha rotulo="Custos percentuais sobre a diária" valor={pct(resultado.percentuais)} />
        <Linha rotulo="Diária mínima (ponto de equilíbrio)" valor={brl(resultado.diaria_minima)} />
        <Linha rotulo="Margem de lucro desejada" valor={pct(resultado.margem_pct)} />
        <Linha rotulo="Diária recomendada (com margem)" valor={brl(resultado.diaria_recomendada)} />
        <Linha rotulo="Custo médio mensal estimado" valor={brl(resultado.custo_mensal)} />
        <Linha rotulo="Custo médio diário (mês inteiro)" valor={brl(resultado.custo_medio_diario)} />
      </dl>
      <p className="mt-4 text-xs leading-relaxed text-ink-soft">
        Diária mínima é o preço abaixo do qual há prejuízo em cada reserva, já descontando taxa da plataforma, comissão e o rateio dos custos fixos pela ocupação. Quanto menor a ocupação, maior o custo fixo que cada diária ocupada precisa cobrir.
      </p>
      {erro && <p className="mt-3 text-sm text-danger">{erro}</p>}
    </div>
  );
}

function Destaque({ valor, rotulo, nota }: { valor: string; rotulo: string; nota: string }) {
  return (
    <div className="rounded-xl bg-paper px-3 py-3">
      <p className="font-display text-lg font-semibold text-ink">{valor}</p>
      <p className="text-sm font-medium text-ink">{rotulo}</p>
      <p className="text-xs text-ink-soft">{nota}</p>
    </div>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-ink-soft">{rotulo}</dt>
      <dd className="text-right font-medium text-ink">{valor}</dd>
    </div>
  );
}
