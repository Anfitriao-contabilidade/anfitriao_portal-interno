"use client";

import { useState } from "react";
import { Check, CreditCard } from "lucide-react";
import { ActionForm } from "@/components/forms/ActionForm";
import { SelectField } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { cn } from "@/lib/cn";
import { assinarPlano } from "./actions";

type Plano = { id: string; titulo: string; descricao: string; preco: string; beneficios: string[]; destaque: boolean };

export function AssinarPlanoForm({ planos }: { planos: Plano[] }) {
  const [planoId, setPlanoId] = useState(planos.find((p) => p.destaque)?.id ?? planos[0]?.id ?? "");

  return (
    <ActionForm action={assinarPlano} className="grid gap-4">
      <fieldset className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <legend className="sr-only">Escolha o plano</legend>
        {planos.map((p) => {
          const ativo = p.id === planoId;
          return (
            <label
              key={p.id}
              className={cn(
                "flex cursor-pointer flex-col gap-2 rounded-xl border p-4 transition-colors",
                ativo ? "border-ocean bg-ocean-50" : "border-line hover:border-ocean/40"
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-medium text-ink">{p.titulo}</span>
                <input
                  type="radio"
                  name="plano_id"
                  value={p.id}
                  checked={ativo}
                  onChange={() => setPlanoId(p.id)}
                  className="h-4 w-4 accent-ocean"
                />
              </span>
              <span className="font-mono text-lg font-medium tabular-nums text-ink">
                {p.preco}
                <span className="text-sm font-normal text-ink-soft">/mês</span>
              </span>
              <span className="text-sm text-ink-soft">{p.descricao}</span>
              <ul className="mt-1 grid gap-1">
                {p.beneficios.slice(0, 4).map((b) => (
                  <li key={b} className="flex gap-1.5 text-xs text-ink-soft">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ocean" aria-hidden />
                    {b}
                  </li>
                ))}
              </ul>
            </label>
          );
        })}
      </fieldset>
      <SelectField label="Como prefere pagar?" name="forma" defaultValue="indefinida" className="sm:max-w-sm">
        <option value="indefinida">Escolher na fatura (Pix, boleto ou cartão)</option>
        <option value="pix">Pix</option>
        <option value="boleto">Boleto</option>
        <option value="cartao">Cartão de crédito</option>
      </SelectField>
      <p className="text-xs text-ink-soft">
        Cobrança mensal recorrente. A primeira fatura vence em 3 dias; o cancelamento é feito com a equipe Anfitrião.
      </p>
      <div>
        <SubmitButton pendingLabel="Assinando…">
          <CreditCard className="h-4 w-4" aria-hidden /> Assinar plano
        </SubmitButton>
      </div>
    </ActionForm>
  );
}
