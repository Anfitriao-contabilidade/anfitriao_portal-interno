import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Receipt } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { api, apiPagina, apiTodos, num } from "@/lib/api";
import { fimDoMes, listarImoveis } from "@/lib/data";
import { ultimosNMeses, fmtBRL, fmtCompetencia } from "@/lib/metrics";
import type { Lancamento, ResumoFinanceiro } from "@/lib/tipos";
import { fmtData } from "@/lib/format";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Financeiro" };

export default async function FinanceiroPage() {
  const sessao = await requireUser();
  const [compAtual] = ultimosNMeses(1);
  const [resumo, doMes, imoveis] = await apiPagina(() =>
    Promise.all([
      api<ResumoFinanceiro>("/metricas/resumo", { query: { competencia: compAtual } }),
      apiTodos<Lancamento>("/lancamentos", { cliente_id: sessao.id, de: `${compAtual}-01`, ate: fimDoMes(compAtual) }),
      listarImoveis(),
    ])
  );
  const fin = { imoveis };
  const nomeImovel = new Map(imoveis.map((i) => [i.id, i.nome]));
  const r = {
    faturamentoTotal: num(resumo.faturamento_total),
    comissaoGestao: num(resumo.comissao_gestao),
    despesasOperacionais: num(resumo.despesas_operacionais),
    valorLiquido: num(resumo.valor_liquido),
  };
  const ehCoAnfitriao = sessao.isCoanfitriao;

  return (
    <>
      <PageHeader
        eyebrow="Operação & financeiro"
        title={`Repasses e comissão — ${fmtCompetencia(compAtual)}`}
        description="Valores lançados pela equipe contábil para o mês corrente."
      />

      {fin.imoveis.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-5 w-5" />}
          title="Cadastre um imóvel para começar"
          description="O financeiro é calculado a partir das reservas e lançamentos de cada imóvel."
          action={<ButtonLink href="/imoveis">Ir para Imóveis</ButtonLink>}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatCard label="Faturamento" value={fmtBRL(r.faturamentoTotal)} />
            <StatCard label="Comissão de gestão" value={fmtBRL(r.comissaoGestao)} />
            <StatCard label="Despesas" value={fmtBRL(r.despesasOperacionais)} />
            <StatCard label="Repasse líquido" highlight tone={r.valorLiquido < 0 ? "negative" : "default"} value={fmtBRL(r.valorLiquido)} />
          </div>

          {r.comissaoGestao > 0 && (
            <Alert tone={ehCoAnfitriao ? "success" : "info"} className="mt-4">
              {ehCoAnfitriao ? (
                <>
                  <strong>Como Co-Anfitrião:</strong> {fmtBRL(r.comissaoGestao)} é o valor de referência da sua nota
                  fiscal de serviço única de {fmtCompetencia(compAtual)}. A equipe gera o rascunho com esse valor —
                  acompanhe em{" "}
                  <Link href="/notas" className="font-medium underline">
                    Notas fiscais
                  </Link>
                  .
                </>
              ) : (
                <>
                  <strong>Você está cadastrado como Proprietário</strong> — a comissão acima é a taxa de gestão dos
                  seus imóveis.
                </>
              )}
            </Alert>
          )}

          <Card as="section" className="mt-8 p-0 sm:p-0">
            <div className="p-5 pb-0 sm:p-6 sm:pb-0">
              <CardHeader title="Lançamentos do período" description={`${doMes.length} lançamento(s) em ${fmtCompetencia(compAtual)}`} />
            </div>
            {doMes.length === 0 ? (
              <div className="p-5 pt-0 sm:p-6 sm:pt-0">
                <EmptyState icon={<Receipt className="h-5 w-5" />} title="Nenhum lançamento neste mês" description="Assim que a equipe registrar receitas ou despesas, elas aparecem aqui." />
              </div>
            ) : (
              <>
                <ul className="divide-y divide-line sm:hidden">
                  {doMes.map((l) => (
                    <li key={l.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{l.categoria}</p>
                        <p className="truncate text-xs text-ink-soft">
                          {fmtData(l.data)} · {l.imovel_id ? nomeImovel.get(l.imovel_id) ?? "—" : "Geral"}
                        </p>
                      </div>
                      <span className={cn("shrink-0 font-mono text-sm tabular-nums", l.tipo === "despesa" ? "text-red-700" : "text-emerald-800")}>
                        {l.tipo === "despesa" ? "−" : "+"} {fmtBRL(num(l.valor))}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="hidden overflow-x-auto sm:block">
                  <table className="w-full text-left text-sm">
                    <caption className="sr-only">Lançamentos de {fmtCompetencia(compAtual)}</caption>
                    <thead>
                      <tr className="border-y border-line bg-paper/60 text-xs uppercase tracking-wide text-ink-soft">
                        <th scope="col" className="py-2.5 pl-6 pr-3 font-medium">Data</th>
                        <th scope="col" className="py-2.5 pr-3 font-medium">Imóvel</th>
                        <th scope="col" className="py-2.5 pr-3 font-medium">Categoria</th>
                        <th scope="col" className="py-2.5 pr-3 font-medium">Tipo</th>
                        <th scope="col" className="py-2.5 pr-6 text-right font-medium">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {doMes.map((l) => (
                        <tr key={l.id} className="hover:bg-paper/50">
                          <td className="py-3 pl-6 pr-3 font-mono text-xs">{fmtData(l.data)}</td>
                          <td className="py-3 pr-3">{l.imovel_id ? nomeImovel.get(l.imovel_id) ?? "—" : "Geral"}</td>
                          <td className="py-3 pr-3">{l.categoria}</td>
                          <td className="py-3 pr-3">
                            <Badge tone={l.tipo === "despesa" ? "danger" : "success"}>{l.tipo === "despesa" ? "Despesa" : "Receita"}</Badge>
                          </td>
                          <td className={cn("py-3 pr-6 text-right font-mono tabular-nums", l.tipo === "despesa" ? "text-red-700" : "text-emerald-800")}>
                            {l.tipo === "despesa" ? "−" : "+"} {fmtBRL(num(l.valor))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>
        </>
      )}
    </>
  );
}
