"use client";

import { useState } from "react";
import { ActionForm, useFormState } from "@/components/forms/ActionForm";
import { InputField, SelectField } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { simularFiscal } from "../actions";

const PERFIS = [
  ["pf_locacao", "Proprietário — locação"],
  ["pf_hospedagem", "Proprietário — hospedagem/temporada"],
  ["gestor_pf", "Coanfitrião — comissão"],
] as const;

function brl(valor: unknown) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function pct(valor: unknown) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return "—";
  return `${(n * 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function Demonstrativo({ competencia }: { competencia: string }) {
  const { resultado } = useFormState();
  const detalhe = resultado?.detalhe;
  if (!resultado || !detalhe || typeof detalhe !== "object" || !("base" in detalhe)) {
    return (
      <div className="flex h-full min-h-48 items-center justify-center rounded-xl bg-paper px-4 py-8 text-center text-sm text-ink-soft">
        Informe a competência e os rendimentos do mês para ver o demonstrativo.
      </div>
    );
  }
  const d = detalhe as Record<string, unknown>;
  const isento = d.isento === true || d.isento === "true";
  const mes = competencia
    ? new Date(`${competencia}-01T00:00:00`).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : "mês informado";

  return (
    <div aria-live="polite">
      <p className="font-mono text-[.7rem] font-semibold uppercase tracking-[.12em] text-ink-soft">Demonstrativo</p>
      <h2 className="mt-1 font-display text-xl font-semibold capitalize text-ink">{mes}</h2>
      <p className="mt-4 font-display text-3xl font-semibold text-ink">{brl(resultado.imposto)}</p>
      <p className="mt-1 text-sm text-ink-soft">DARF estimado · código 0190</p>
      <dl className="mt-4 divide-y divide-line text-sm">
        <Linha rotulo="Rendimentos do mês" valor={brl(d.receita)} />
        {Number(d.desconto) > 0 && (
          <Linha rotulo="Desconto simplificado (20%, teto R$ 607,20)" valor={`-${brl(d.desconto)}`} />
        )}
        <Linha rotulo="Base de cálculo" valor={brl(d.base)} />
        {isento ? (
          <Linha rotulo="Faixa" valor="Isento até R$ 5.000 (Lei 15.270/2025)" />
        ) : (
          <>
            <Linha rotulo="Alíquota da faixa" valor={pct(d.aliquota_nominal)} />
            <Linha rotulo="Imposto pela tabela" valor={brl(d.imposto_bruto)} />
            {Number(d.redutor) > 0 && <Linha rotulo="Redutor (Lei 15.270/2025)" valor={`-${brl(d.redutor)}`} />}
          </>
        )}
        <Linha rotulo="Alíquota efetiva" valor={pct(d.aliquota_efetiva)} />
      </dl>
      <p className="mt-4 text-xs leading-relaxed text-ink-soft">
        Recolhimento no último dia útil do mês seguinte. Vale para rendimentos pagos por pessoa física ou do exterior. Estimativa interna — não substitui a apuração oficial.
      </p>
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

export function CarneLeaoPainel() {
  const [competencia, setCompetencia] = useState("");

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Card>
        <Alert tone="info" className="mb-5" title="Pessoa física">
          Apuração mensal do Carnê-Leão para locação, hospedagem ou comissão de coanfitrião.
        </Alert>
        <ActionForm action={simularFiscal} className="grid gap-4">
          <SelectField label="Natureza do rendimento" name="perfil" required defaultValue="pf_locacao">
            {PERFIS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </SelectField>
          <InputField
            label="Competência"
            name="competencia"
            type="month"
            required
            value={competencia}
            onChange={(e) => setCompetencia(e.target.value)}
          />
          <InputField label="Rendimentos do mês" name="receita" inputMode="decimal" required hint="Soma recebida na competência." />
          <SelectField label="Dedução" name="modo_deducao">
            <option value="simplificado">Desconto simplificado (20%, teto R$ 607,20)</option>
            <option value="reais">Deduções reais já aplicadas no valor informado</option>
          </SelectField>
          <SubmitButton>Calcular DARF</SubmitButton>
        </ActionForm>
      </Card>
      <Card>
        <Demonstrativo competencia={competencia} />
      </Card>
    </div>
  );
}
