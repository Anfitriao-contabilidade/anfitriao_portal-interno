"use client";

import { useState } from "react";
import { ActionForm, useFormState } from "@/components/forms/ActionForm";
import { InputField, SelectField } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Card } from "@/components/ui/Card";
import { simularFiscal } from "../actions";

const PERFIS_PF = new Set(["pf_locacao", "pf_hospedagem", "gestor_pf"]);
const PERFIS_SIMPLES = new Set(["pj_simples", "gestor_pj"]);

const PERFIS = [
  ["pf_locacao", "Proprietário PF — Locação"],
  ["pf_hospedagem", "Proprietário PF — Hospedagem/temporada"],
  ["gestor_pf", "Gestor PF — Coanfitrião"],
  ["pj_simples", "PJ Simples"],
  ["gestor_pj", "Gestor PJ"],
  ["mei", "MEI"],
  ["pj_presumido", "PJ lucro presumido"],
  ["nao_residente", "Não residente"],
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

function Resultado() {
  const { resultado } = useFormState();
  const detalhe = resultado?.detalhe;
  if (!resultado || !detalhe || typeof detalhe !== "object") return null;
  const d = detalhe as Record<string, unknown>;
  if (!("base" in d)) return null;

  const isento = d.isento === true || d.isento === "true";
  return (
    <div className="mt-6 border-t border-line pt-5" aria-live="polite">
      <p className="font-display text-3xl font-semibold text-ink">{brl(resultado.imposto)}</p>
      <p className="mt-1 text-sm text-ink-soft">DARF estimado (Carnê-Leão)</p>
      <dl className="mt-4 divide-y divide-line text-sm">
        <Linha rotulo="Receita bruta do mês" valor={brl(d.receita)} />
        {Number(d.desconto) > 0 && (
          <Linha rotulo="Desconto simplificado (20%, teto R$ 607,20)" valor={`-${brl(d.desconto)}`} />
        )}
        <Linha rotulo="Base tributável" valor={brl(d.base)} />
        {isento ? (
          <Linha rotulo="Faixa" valor="Isento (base até R$ 5.000 — Lei 15.270/2025)" />
        ) : (
          <>
            <Linha rotulo="Alíquota nominal da faixa" valor={pct(d.aliquota_nominal)} />
            <Linha rotulo="Imposto pela tabela (antes do redutor)" valor={brl(d.imposto_bruto)} />
            {Number(d.redutor) > 0 && <Linha rotulo="Redutor Lei 15.270/2025" valor={`-${brl(d.redutor)}`} />}
          </>
        )}
      </dl>
      <p className="mt-4 text-xs leading-relaxed text-ink-soft">
        Carnê-Leão: recolhimento mensal para pessoa física que recebe de outra pessoa física ou do exterior.
        Alíquota efetiva sobre a receita: {pct(d.aliquota_efetiva)}. Estimativa para apoio interno — não substitui a apuração oficial.
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

export function SimuladorFiscal() {
  const [perfil, setPerfil] = useState<string>("pf_locacao");
  const pf = PERFIS_PF.has(perfil);
  const simples = PERFIS_SIMPLES.has(perfil);
  const mei = perfil === "mei";

  return (
    <Card>
      <ActionForm action={simularFiscal} className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Perfil" name="perfil" required value={perfil} onChange={(e) => setPerfil(e.target.value)}>
          {PERFIS.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </SelectField>
        <InputField label="Receita mensal" name="receita" inputMode="decimal" required hint={pf ? "Bruta do mês, ou líquida se a dedução for real." : undefined} />
        {pf && (
          <SelectField label="Modo de dedução (Carnê-Leão)" name="modo_deducao" className="sm:col-span-2">
            <option value="simplificado">Desconto simplificado (20%, teto R$ 607,20/mês)</option>
            <option value="reais">Valor já líquido (deduções reais aplicadas por fora)</option>
          </SelectField>
        )}
        {simples && (
          <InputField label="RBT12" name="rbt12" inputMode="decimal" optional hint="Em branco, usa receita × 12." />
        )}
        {mei && (
          <SelectField label="Atividade MEI" name="atividade_mei">
            <option value="servico">Serviço</option>
            <option value="comercio">Comércio</option>
            <option value="ambos">Ambos</option>
          </SelectField>
        )}
        <InputField label="CNAE" name="cnae" optional hint="Conferência de hospedagem (5510-8/01 e afins)." className={pf || simples || mei ? undefined : "sm:col-span-2"} />
        <div className="sm:col-span-2">
          <SubmitButton>Simular</SubmitButton>
        </div>
        {pf && (
          <div className="sm:col-span-2">
            <Resultado />
          </div>
        )}
      </ActionForm>
    </Card>
  );
}
