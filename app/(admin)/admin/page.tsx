import Link from "next/link";
import { AlertTriangle, FileText, UserCheck, Users } from "lucide-react";
import { api, apiPagina, type Pagina } from "@/lib/api";
import { listarUsuarios } from "@/lib/data";
import { fmtData } from "@/lib/format";
import type { NotaFiscal, Obrigacao } from "@/lib/tipos";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { ButtonLink } from "@/components/ui/Button";

export const metadata = { title: "Dashboard" };

export default async function AdminHome() {
  const [usuarios, obrigacoes, notas] = await apiPagina(() =>
    Promise.all([
      listarUsuarios(),
      api<Pagina<Obrigacao>>("/obrigacoes", { query: { status: "pendente", limit: 5 } }),
      api<Pagina<NotaFiscal>>("/notas-fiscais", { query: { limit: 5 } }),
    ])
  );

  const pendentes = usuarios.filter((u) => u.situacao_cadastro === "pendente");
  const ativos = usuarios.filter((u) => u.ativo && !u.papeis.includes("admin"));
  const atrasadas = obrigacoes.items.filter((o) => (o.dias_para_vencer ?? 0) < 0);

  return (
    <>
      <PageHeader
        eyebrow="Equipe"
        title="Carteira"
        description="Pendências de cadastro, obrigações e notas da operação. Os números de um cliente ficam na ficha dele."
      />

      {pendentes.length > 0 && (
        <Alert tone="warning" className="mb-6" title={`${pendentes.length} cadastro(s) aguardando análise`}>
          <Link href="/admin/clientes" className="font-medium underline">
            Abrir clientes
          </Link>
        </Alert>
      )}

      <section aria-labelledby="atencao">
        <h2 id="atencao" className="mb-3 font-display text-lg font-semibold text-ink">
          Precisa de atenção
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatCard label="Cadastros pendentes" value={pendentes.length} tone={pendentes.length ? "negative" : "positive"} icon={<UserCheck className="h-4 w-4" />} hint={<Link href="/admin/clientes" className="font-medium text-ocean hover:underline">Revisar</Link>} />
          <StatCard label="Obrigações em aberto" value={obrigacoes.total} tone={obrigacoes.total ? "negative" : "default"} icon={<AlertTriangle className="h-4 w-4" />} hint={atrasadas.length ? `${atrasadas.length} já vencida(s) nesta página` : "Nesta amostra"} />
          <StatCard label="Clientes ativos" value={ativos.length} icon={<Users className="h-4 w-4" />} />
          <StatCard label="Notas recentes" value={notas.total} icon={<FileText className="h-4 w-4" />} hint={<Link href="/admin/notas" className="font-medium text-ocean hover:underline">Emitir</Link>} />
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card as="section">
          <CardHeader title="Obrigações pendentes" description="As cinco mais recentes da consulta." action={<ButtonLink href="/admin/fiscal" variant="ghost" size="sm">Simulador</ButtonLink>} />
          <ListaObrigacoes items={obrigacoes.items} />
        </Card>
        <Card as="section">
          <CardHeader title="Últimas notas" action={<ButtonLink href="/admin/notas" variant="ghost" size="sm">Ver todas</ButtonLink>} />
          {notas.items.length === 0 ? (
            <p className="rounded-xl bg-paper px-4 py-6 text-center text-sm text-ink-soft">Nenhuma nota emitida.</p>
          ) : (
            <ul className="divide-y divide-line">
              {notas.items.map((n) => (
                <li key={n.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="min-w-0 truncate font-medium text-ink">{n.tomador_nome || n.tipo}</span>
                  <span className="shrink-0 font-mono text-xs text-ink-soft">{n.status}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

function ListaObrigacoes({ items }: { items: Obrigacao[] }) {
  if (items.length === 0) {
    return <p className="rounded-xl bg-paper px-4 py-6 text-center text-sm text-ink-soft">Nenhuma obrigação pendente na carteira.</p>;
  }
  return (
    <ul className="divide-y divide-line">
      {items.map((o) => (
        <li key={o.id} className="flex items-center justify-between gap-3 py-3 text-sm">
          <span className="min-w-0 truncate text-ink">
            {o.tipo}
            {o.competencia ? <span className="text-ink-soft"> · {o.competencia}</span> : null}
          </span>
          <span className="shrink-0 font-mono text-xs text-ink-soft">{fmtData(o.vencimento)}</span>
        </li>
      ))}
    </ul>
  );
}
