import type { Metadata } from "next";
import { Landmark } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { apiPagina, apiTodos, num } from "@/lib/api";
import type { Obrigacao } from "@/lib/tipos";
import { fmtBRL } from "@/lib/metrics";
import { fmtData } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import { ObrigacaoBadge, situacaoObrigacao } from "@/components/domain/badges";

export const metadata: Metadata = { title: "Impostos" };

export default async function ImpostosPage() {
  const sessao = await requireUser();
  // cliente_id explícito: para a equipe (admin) esta tela também mostra só as próprias obrigações.
  const data = await apiPagina(() => apiTodos<Obrigacao>("/obrigacoes", { cliente_id: sessao.id }));

  const lista = data
    .map((o) => ({ ...o, sit: situacaoObrigacao(o.vencimento, o.status) }))
    .sort((a, b) => a.sit.ordem - b.sit.ordem || a.vencimento.localeCompare(b.vencimento));

  const abertas = lista.filter((o) => o.status !== "pago");
  const atrasadas = lista.filter((o) => o.sit.label === "Atrasada");
  const totalAberto = abertas.reduce((s, o) => s + num(o.valor), 0);

  return (
    <>
      <PageHeader
        eyebrow="Fiscal"
        title="Impostos e obrigações"
        description="Lançadas e confirmadas pela equipe da Anfitrião. Se algo já foi pago e ainda aparece pendente, fale com o seu contador."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard label="Em aberto" value={abertas.length} />
        <StatCard label="Atrasadas" value={atrasadas.length} tone={atrasadas.length ? "negative" : "default"} />
        <StatCard label="Total em aberto" value={fmtBRL(totalAberto)} highlight className="col-span-2 sm:col-span-1" />
      </div>

      {lista.length === 0 ? (
        <EmptyState icon={<Landmark className="h-5 w-5" />} title="Nenhuma obrigação lançada ainda" />
      ) : (
        <Card className="p-0 sm:p-0">
          <ul className="divide-y divide-line">
            {lista.map((o) => (
              <li key={o.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="min-w-0">
                  <p className="font-medium text-ink">
                    {o.tipo}
                    {o.competencia ? <span className="font-normal text-ink-soft"> · competência {o.competencia}</span> : null}
                  </p>
                  {o.descricao && <p className="text-sm text-ink-soft">{o.descricao}</p>}
                  <p className="mt-1 font-mono text-xs text-ink-soft">
                    Vence em {fmtData(o.vencimento)}
                    {o.status === "pago" && o.pago_em ? ` · pago em ${fmtData(o.pago_em)}` : ""}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  {o.valor != null && <span className="font-mono text-sm font-medium tabular-nums text-ink">{fmtBRL(num(o.valor))}</span>}
                  <ObrigacaoBadge vencimento={o.vencimento} status={o.status} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
