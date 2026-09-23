import { fmtBRL, fmtCompetencia, type MetricasMes } from "@/lib/metrics";

/** Gráfico de barras simples (sem biblioteca externa) da lucratividade mês a mês. */
export default function BarChart({ serie }: { serie: MetricasMes[] }) {
  const max = Math.max(1, ...serie.map((m) => Math.abs(m.valorLiquido)));

  return (
    <div className="flex items-end gap-3 overflow-x-auto py-4" style={{ height: 190 }}>
      {serie.map((m) => {
        const alturaPct = Math.max(4, (Math.abs(m.valorLiquido) / max) * 100);
        const positivo = m.valorLiquido >= 0;
        return (
          <div key={m.competencia} className="flex min-w-[56px] flex-1 flex-col items-center justify-end gap-2" style={{ height: "100%" }}>
            <span className="whitespace-nowrap font-mono text-[11px] text-ink-soft">
              {fmtBRL(m.valorLiquido)}
            </span>
            <div
              className={`w-full max-w-[36px] rounded-t ${positivo ? "bg-ocean" : "bg-red-400"}`}
              style={{ height: `${alturaPct}%` }}
              title={`${fmtCompetencia(m.competencia)}: ${fmtBRL(m.valorLiquido)} líquido`}
            />
            <span className="font-mono text-[11px] text-ink-soft">{fmtCompetencia(m.competencia)}</span>
          </div>
        );
      })}
    </div>
  );
}
