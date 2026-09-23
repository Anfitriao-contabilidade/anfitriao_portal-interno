import { fmtBRL, fmtCompetencia, type MetricasMes } from "@/lib/metrics";
import { cn } from "@/lib/cn";

/**
 * Gráfico de barras do lucro líquido mensal (sem biblioteca: HTML/CSS puro,
 * responsivo, com tabela equivalente para leitores de tela).
 */
export function BarChart({ serie, titulo }: { serie: MetricasMes[]; titulo: string }) {
  const max = Math.max(1, ...serie.map((m) => Math.abs(m.valorLiquido)));
  const melhor = serie.reduce((a, b) => (b.valorLiquido > a.valorLiquido ? b : a), serie[0]);

  return (
    <figure>
      <div aria-hidden className="relative mt-2">
        <div className="flex h-56 items-end gap-2 border-b border-line sm:gap-4">
          {serie.map((m) => {
            const altura = Math.max(3, (Math.abs(m.valorLiquido) / max) * 100);
            const positivo = m.valorLiquido >= 0;
            const destaque = m.competencia === melhor?.competencia && positivo;
            return (
              <div key={m.competencia} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end">
                <span className="mb-1.5 hidden whitespace-nowrap font-mono text-[10px] text-ink-soft sm:block">
                  {fmtBRL(m.valorLiquido).replace(/,\d{2}$/, "")}
                </span>
                <div
                  className={cn(
                    "w-full max-w-12 rounded-t-md transition-opacity group-hover:opacity-80",
                    positivo ? (destaque ? "bg-gold" : "bg-ocean") : "bg-red-400"
                  )}
                  style={{ height: `${altura}%` }}
                  title={`${fmtCompetencia(m.competencia)}: ${fmtBRL(m.valorLiquido)}`}
                />
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex gap-2 sm:gap-4">
          {serie.map((m) => (
            <span key={m.competencia} className="flex-1 text-center font-mono text-[11px] text-ink-soft">
              {fmtCompetencia(m.competencia)}
            </span>
          ))}
        </div>
      </div>
      <figcaption className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-ocean" aria-hidden /> Lucro líquido
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-gold" aria-hidden /> Melhor mês
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-red-400" aria-hidden /> Prejuízo
        </span>
      </figcaption>
      <table className="sr-only">
        <caption>{titulo}</caption>
        <thead>
          <tr>
            <th scope="col">Mês</th>
            <th scope="col">Lucro líquido</th>
          </tr>
        </thead>
        <tbody>
          {serie.map((m) => (
            <tr key={m.competencia}>
              <td>{fmtCompetencia(m.competencia)}</td>
              <td>{fmtBRL(m.valorLiquido)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
