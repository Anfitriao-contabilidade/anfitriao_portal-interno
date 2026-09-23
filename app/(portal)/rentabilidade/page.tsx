import type { Metadata } from "next";
import { Building2, Trophy } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { api, apiPagina, num } from "@/lib/api";
import { serieDoImovel } from "@/lib/data";
import { fmtBRL, fmtCompetencia, type MetricasMes } from "@/lib/metrics";
import type { LinhaRanking } from "@/lib/tipos";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { BarChart } from "@/components/domain/BarChart";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Rentabilidade" };

export default async function RentabilidadePage() {
  await requireUser();
  const { ranking, serie } = await apiPagina(async () => {
    const linhas = await api<LinhaRanking[]>("/metricas/ranking", { query: { meses: 6 } });
    const ranking = linhas.map((l) => ({
      imovelId: l.imovel_id,
      imovelNome: l.imovel_nome,
      faturamentoTotal: num(l.faturamento_total),
      comissaoTotal: num(l.comissao_total),
      liquidoTotal: num(l.liquido_total),
      ocupacaoMediaPct: l.ocupacao_media_pct,
    }));
    const serie: MetricasMes[] = ranking[0] ? await serieDoImovel(ranking[0].imovelId, 6) : [];
    return { ranking, serie };
  });
  const destaque = ranking[0] ? { id: ranking[0].imovelId, nome: ranking[0].imovelNome } : undefined;

  const melhor = serie.length ? serie.reduce((a, b) => (b.valorLiquido > a.valorLiquido ? b : a)) : null;

  return (
    <>
      <PageHeader
        eyebrow="Operação & financeiro"
        title="Rentabilidade"
        description="Faturamento e lucro real dos seus imóveis nos últimos 6 meses — já descontadas a taxa de gestão e as despesas lançadas."
      />

      {ranking.length === 0 ? (
        <EmptyState icon={<Building2 className="h-5 w-5" />} title="Cadastre um imóvel para ver a rentabilidade" action={<ButtonLink href="/imoveis">Ir para Imóveis</ButtonLink>} />
      ) : (
        <div className="grid gap-6">
          {destaque && melhor && (
            <Card as="section">
              <CardHeader
                title={`Desempenho mensal — ${destaque.nome}`}
                description="Lucro líquido mês a mês do imóvel com melhor resultado acumulado."
              />
              <BarChart serie={serie} titulo={`Lucro líquido mensal — ${destaque.nome}`} />
              <p className="mt-4 text-sm text-ink-soft">
                Melhor mês: <strong className="text-ink">{fmtCompetencia(melhor.competencia)}</strong> ({fmtBRL(melhor.valorLiquido)})
              </p>
            </Card>
          )}

          <Card as="section" className="p-0 sm:p-0">
            <div className="p-5 pb-0 sm:p-6 sm:pb-0">
              <CardHeader title="Ranking dos seus imóveis" description="Ordenado pelo lucro líquido acumulado em 6 meses." />
            </div>
            <ol className="divide-y divide-line md:hidden">
              {ranking.map((l, idx) => (
                <li key={l.imovelId} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="flex min-w-0 items-center gap-2 font-medium text-ink">
                      <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-xs", idx === 0 ? "bg-gold text-ocean-deep" : "bg-paper text-ink-soft")}>
                        {idx + 1}
                      </span>
                      <span className="truncate">{l.imovelNome}</span>
                    </p>
                    <p className="font-mono text-sm font-semibold tabular-nums text-ocean">{fmtBRL(l.liquidoTotal)}</p>
                  </div>
                  <dl className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div><dt className="text-ink-soft">Faturamento</dt><dd className="font-mono tabular-nums">{fmtBRL(l.faturamentoTotal)}</dd></div>
                    <div><dt className="text-ink-soft">Comissão</dt><dd className="font-mono tabular-nums">{fmtBRL(l.comissaoTotal)}</dd></div>
                    <div><dt className="text-ink-soft">Ocupação</dt><dd className="font-mono tabular-nums">{l.ocupacaoMediaPct}%</dd></div>
                  </dl>
                </li>
              ))}
            </ol>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Ranking de rentabilidade dos imóveis nos últimos 6 meses</caption>
                <thead>
                  <tr className="border-y border-line bg-paper/60 text-xs uppercase tracking-wide text-ink-soft">
                    <th scope="col" className="py-3 pl-6 pr-3 font-medium">#</th>
                    <th scope="col" className="py-3 pr-3 font-medium">Imóvel</th>
                    <th scope="col" className="py-3 pr-3 text-right font-medium">Faturamento</th>
                    <th scope="col" className="py-3 pr-3 text-right font-medium">Comissão</th>
                    <th scope="col" className="py-3 pr-3 text-right font-medium">Líquido</th>
                    <th scope="col" className="py-3 pr-6 text-right font-medium">Ocupação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {ranking.map((l, idx) => (
                    <tr key={l.imovelId} className="hover:bg-paper/50">
                      <td className="py-3 pl-6 pr-3">
                        {idx === 0 ? <Trophy className="h-4 w-4 text-gold" aria-label="1º lugar" /> : <span className="font-mono text-xs text-ink-soft">{idx + 1}</span>}
                      </td>
                      <td className="py-3 pr-3 font-medium">{l.imovelNome}</td>
                      <td className="py-3 pr-3 text-right font-mono tabular-nums">{fmtBRL(l.faturamentoTotal)}</td>
                      <td className="py-3 pr-3 text-right font-mono tabular-nums">{fmtBRL(l.comissaoTotal)}</td>
                      <td className="py-3 pr-3 text-right font-mono font-semibold tabular-nums text-ocean">{fmtBRL(l.liquidoTotal)}</td>
                      <td className="py-3 pr-6 text-right font-mono tabular-nums">{l.ocupacaoMediaPct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
