import Link from "next/link";
import { ArrowRight, Building2, CalendarClock, Landmark, TrendingDown, TrendingUp } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { api, apiPagina, num, type Pagina } from "@/lib/api";
import { ultimosNMeses, fmtBRL, fmtCompetencia } from "@/lib/metrics";
import { fmtData } from "@/lib/format";
import type { Obrigacao, Painel } from "@/lib/tipos";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { ObrigacaoBadge, StatusFiscalBadge } from "@/components/domain/badges";

function saudacao() {
  const h = Number(
    new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hour12: false, timeZone: "America/Sao_Paulo" }).format(new Date())
  );
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

export default async function HomePage() {
  const sessao = await requireUser();

  // Métricas calculadas na API (mesma fórmula de lib/metrics.ts, agora no servidor).
  const [painel, pendentesPag] = await apiPagina(() =>
    Promise.all([
      api<Painel>("/metricas/painel"),
      api<Pagina<Obrigacao>>("/obrigacoes", { query: { cliente_id: sessao.id, status: "pendente", limit: 5 } }),
    ])
  );

  const [compAnterior, compAtual] = ultimosNMeses(2);
  const resumo = (r: Painel["mes_atual"]) => ({
    faturamentoTotal: num(r.faturamento_total),
    comissaoGestao: num(r.comissao_gestao),
    despesasOperacionais: num(r.despesas_operacionais),
    valorLiquido: num(r.valor_liquido),
    ocupacaoMediaPct: r.ocupacao_media_pct,
  });
  const atual = resumo(painel.mes_atual);
  const anterior = resumo(painel.mes_anterior);
  const variacao =
    anterior.valorLiquido !== 0
      ? Math.round(((atual.valorLiquido - anterior.valorLiquido) / Math.abs(anterior.valorLiquido)) * 100)
      : null;

  const pendentes = pendentesPag.items;
  const totalPendentes = pendentesPag.total;
  const totalAtrasadas = painel.obrigacoes_atrasadas;
  const status = painel.status_fiscal;
  const ehCoAnfitriao = sessao.isCoanfitriao;
  const primeiroNome = sessao.nome.split(" ")[0];
  const totalImoveis = painel.total_imoveis;

  return (
    <>
      <PageHeader
        eyebrow={`${saudacao()}, ${primeiroNome}`}
        title="Visão geral do seu negócio"
        description={`Resumo de ${fmtCompetencia(compAtual)} consolidando todos os seus imóveis.`}
        actions={<StatusFiscalBadge status={status} />}
      />

      {totalAtrasadas > 0 && (
        <Alert tone="danger" role="alert" className="mb-6" title={`${totalAtrasadas} obrigação(ões) vencida(s)`}>
          Regularize para evitar multa e juros.{" "}
          <Link href="/impostos" className="font-medium underline">
            Ver impostos
          </Link>
        </Alert>
      )}

      <section aria-labelledby="saude">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="saude" className="font-display text-lg font-semibold text-ink">
            Saúde financeira — {fmtCompetencia(compAtual)}
          </h2>
          <Link href="/rentabilidade" className="inline-flex items-center gap-1 text-sm font-medium text-ocean hover:underline">
            Ver por imóvel <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        {totalImoveis === 0 ? (
          <EmptyState
            icon={<Building2 className="h-5 w-5" />}
            title="Nenhum imóvel cadastrado ainda"
            description="Cadastre seu primeiro imóvel para acompanhar faturamento, repasses e ocupação aqui."
            action={<ButtonLink href="/imoveis">Cadastrar imóvel</ButtonLink>}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              <StatCard label="Faturamento" value={fmtBRL(atual.faturamentoTotal)} hint="Reservas + receitas lançadas" />
              <StatCard label="Comissão de gestão" value={fmtBRL(atual.comissaoGestao)} hint="Retida pela gestão dos imóveis" />
              <StatCard label="Despesas" value={fmtBRL(atual.despesasOperacionais)} hint="Lançadas no mês (sem a comissão)" />
              <StatCard
                label="Repasse líquido"
                highlight
                tone={atual.valorLiquido < 0 ? "negative" : "default"}
                value={fmtBRL(atual.valorLiquido)}
                hint={
                  <>
                    {atual.ocupacaoMediaPct}% de ocupação média
                    {variacao !== null && (
                      <span className={variacao >= 0 ? "ml-1 text-emerald-800" : "ml-1 text-red-700"}>
                        · {variacao >= 0 ? <TrendingUp className="inline h-3 w-3" aria-hidden /> : <TrendingDown className="inline h-3 w-3" aria-hidden />}{" "}
                        {variacao >= 0 ? "+" : "−"}
                        {Math.abs(variacao)}% vs {fmtCompetencia(compAnterior)}
                      </span>
                    )}
                  </>
                }
              />
            </div>

            {atual.comissaoGestao > 0 && (
              <Alert tone={ehCoAnfitriao ? "success" : "info"} className="mt-4">
                {ehCoAnfitriao ? (
                  <>
                    <strong>Como Co-Anfitrião:</strong> {fmtBRL(atual.comissaoGestao)} é o valor de referência para
                    emitir uma única nota fiscal de serviço da sua gestão em {fmtCompetencia(compAtual)}. O restante (
                    {fmtBRL(atual.valorLiquido)}) é do(s) proprietário(s). Detalhes em{" "}
                    <Link href="/rentabilidade" className="font-medium underline">
                      Rentabilidade
                    </Link>
                    .
                  </>
                ) : (
                  <>
                    <strong>Você está cadastrado como Proprietário</strong> — a comissão acima é a taxa cobrada pela
                    gestão dos seus imóveis. Se também administra imóveis de terceiros, peça à equipe para ajustar seu{" "}
                    <Link href="/perfil" className="font-medium underline">
                      perfil
                    </Link>
                    .
                  </>
                )}
              </Alert>
            )}
          </>
        )}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:grid-cols-1">
          <StatCard label="Imóveis" value={totalImoveis} icon={<Building2 className="h-4 w-4" />} hint={<Link href="/imoveis" className="font-medium text-ocean hover:underline">Gerenciar</Link>} />
          <StatCard label="Em aberto" value={totalPendentes} icon={<CalendarClock className="h-4 w-4" />} hint={<Link href="/impostos" className="font-medium text-ocean hover:underline">Ver todas</Link>} />
          <StatCard label="Vencidas" value={totalAtrasadas} tone={totalAtrasadas ? "negative" : "default"} icon={<Landmark className="h-4 w-4" />} hint={totalAtrasadas ? "Requer atenção" : "Tudo em dia"} />
        </div>

        <Card as="section">
          <CardHeader
            title="Próximos vencimentos"
            description="Obrigações lançadas pela sua equipe contábil."
            action={
              <Link href="/impostos" className="text-sm font-medium text-ocean hover:underline">
                Ver todas
              </Link>
            }
          />
          {pendentes.length === 0 ? (
            <p className="rounded-xl bg-paper px-4 py-6 text-center text-sm text-ink-soft">Nenhuma obrigação pendente — tudo em dia.</p>
          ) : (
            <ul className="divide-y divide-line">
              {pendentes.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {o.tipo}
                      {o.competencia ? <span className="text-ink-soft"> · {o.competencia}</span> : null}
                    </p>
                    <p className="font-mono text-xs text-ink-soft">
                      {fmtData(o.vencimento)}
                      {o.valor != null ? ` · ${fmtBRL(num(o.valor))}` : ""}
                    </p>
                  </div>
                  <ObrigacaoBadge vencimento={o.vencimento} status={o.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
