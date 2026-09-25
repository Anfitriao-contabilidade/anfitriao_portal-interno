"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Lightbulb } from "lucide-react";
import { ActionForm, FormMessage } from "@/components/forms/ActionForm";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Progress } from "@/components/ui/Progress";
import { CHECKLIST_APTO_CATEGORIAS, checklistItemKey, checklistScoreInfo } from "@/lib/checklistApto";
import { cn } from "@/lib/cn";
import { salvarChecklistApto } from "./actions";

function fmt(n: number) {
  return n.toFixed(1).replace(".", ",");
}

/**
 * Checklist com nota calculada ao vivo enquanto o usuário marca os itens
 * (mesma fórmula do servidor) e botão de salvar fixo no rodapé.
 */
export function ChecklistForm({ imovelId, inicial }: { imovelId: string; inicial: Record<string, boolean> }) {
  const [marcados, setMarcados] = useState<Record<string, boolean>>(inicial);
  const info = useMemo(() => checklistScoreInfo(marcados), [marcados]);
  const alterado = useMemo(() => {
    const a = Object.keys(marcados).filter((k) => marcados[k]).sort().join();
    const b = Object.keys(inicial).filter((k) => inicial[k]).sort().join();
    return a !== b;
  }, [marcados, inicial]);

  function toggle(key: string, value: boolean) {
    setMarcados((m) => {
      const next = { ...m };
      if (value) next[key] = true;
      else delete next[key];
      return next;
    });
  }

  const tone = info.nota >= 8 ? "text-emerald-800" : info.nota >= 5 ? "text-amber-800" : "text-red-700";

  return (
    <ActionForm action={salvarChecklistApto} showMessage={false}>
      <input type="hidden" name="imovel_id" value={imovelId} />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-paper/70 p-4">
          <p className="text-xs uppercase tracking-wide text-ink-soft">Nota de prontidão</p>
          <p className={cn("mt-1 font-display text-3xl font-semibold tabular-nums", tone)}>
            {fmt(info.nota)}
            <span className="text-base text-ink-soft"> / 10</span>
          </p>
        </div>
        <div className="rounded-xl border border-line bg-paper/70 p-4">
          <p className="text-xs uppercase tracking-wide text-ink-soft">Itens marcados</p>
          <p className="mt-1 font-display text-3xl font-semibold tabular-nums text-ink">
            {info.totalChecados}
            <span className="text-base text-ink-soft"> / {info.totalItens}</span>
          </p>
        </div>
        <div className="rounded-xl border border-line bg-paper/70 p-4 text-xs leading-relaxed text-ink-soft">
          Peso igual entre as 7 categorias: cada uma vale o mesmo na nota final, não importa quantos itens tem.
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {CHECKLIST_APTO_CATEGORIAS.map((cat, ci) => {
          const det = info.detalhes[ci];
          return (
            <details key={cat.nome} className="group/cat rounded-xl border border-line bg-white">
              <summary className="flex min-h-14 cursor-pointer items-center gap-4 rounded-xl px-4 py-3 hover:bg-paper/60">
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-medium text-ink">{cat.nome}</span>
                    <span className="font-mono text-xs tabular-nums text-ink-soft">
                      {det.checados}/{det.total}
                    </span>
                  </span>
                  <Progress value={det.checados} max={det.total} label={`${cat.nome}: ${det.checados} de ${det.total}`} className="mt-2" />
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-ink-soft transition-transform group-open/cat:rotate-180" aria-hidden />
              </summary>
              <ul className="divide-y divide-line border-t border-line">
                {cat.itens.map((item, ii) => {
                  const key = checklistItemKey(ci, ii);
                  const checked = !!marcados[key];
                  return (
                    <li key={key}>
                      <label className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-paper/50">
                        <input
                          type="checkbox"
                          name="item"
                          value={key}
                          checked={checked}
                          onChange={(e) => toggle(key, e.target.checked)}
                          className="mt-0.5 h-5 w-5 shrink-0 rounded border-line"
                        />
                        <span className="text-sm">
                          <span className="font-medium text-ink">{item.nome}</span>
                          {item.qtd && item.qtd !== "—" ? <span className="text-ink-soft"> · sugestão: {item.qtd}</span> : null}
                          <span className="mt-0.5 block text-xs text-ink-soft">{item.desc}</span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </details>
          );
        })}
      </div>

      <div className="sticky bottom-20 z-10 mt-6 flex flex-col gap-2 rounded-xl border border-line bg-white/95 p-3 shadow-pop backdrop-blur sm:flex-row sm:items-center sm:justify-between lg:bottom-4">
        <p className="text-sm text-ink-soft" aria-live="polite">
          {alterado ? "Você tem alterações não salvas." : "Tudo salvo."}
        </p>
        <SubmitButton pendingLabel="Salvando…">
          <Check className="h-4 w-4" aria-hidden /> Salvar checklist
        </SubmitButton>
      </div>
      <FormMessage className="mt-3" />

      {info.sugestoes.length > 0 ? (
        <details className="group/sug mt-6 rounded-xl border border-gold/30 bg-gold-50/60">
          <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-gold-dark">
            <span className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" aria-hidden />
              Por que vale ter os {info.sugestoes.length} itens que faltam
            </span>
            <ChevronDown className="h-4 w-4 transition-transform group-open/sug:rotate-180" aria-hidden />
          </summary>
          <ul className="space-y-2 border-t border-gold/20 p-4">
            {info.sugestoes.map((s) => (
              <li key={s.categoria + s.item} className="rounded-lg bg-white px-3 py-2 text-xs leading-relaxed text-ink-soft">
                <strong className="text-ink">
                  {s.categoria} · {s.item}:
                </strong>{" "}
                {s.impacto}
              </li>
            ))}
          </ul>
        </details>
      ) : (
        <p className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Todos os itens marcados — prontidão máxima para este imóvel!
        </p>
      )}
    </ActionForm>
  );
}
