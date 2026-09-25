import { api } from "@/lib/api";
import { fmtDataHora } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChips } from "@/components/ui/FilterChips";

type Evento = {
  id: string;
  ator_id: string | null;
  acao: string;
  entidade: string;
  entidade_id: string | null;
  criado_em: string;
};

const ENTIDADES = ["", "usuarios", "imoveis", "lancamentos", "obrigacoes_fiscais", "notas_fiscais", "fechamentos", "contratos", "extratos"];

export const metadata = { title: "Auditoria" };

export default async function AuditoriaPage({ searchParams }: { searchParams: Promise<{ entidade?: string }> }) {
  const sp = await searchParams;
  const entidade = ENTIDADES.includes(sp.entidade ?? "") ? (sp.entidade ?? "") : "";
  const pagina = await api<{ items: Evento[]; total: number }>("/auditoria", {
    query: { limit: 50, entidade: entidade || undefined },
  });

  return (
    <>
      <PageHeader eyebrow="Sistema" title="Auditoria" description="Quem alterou o quê. A API registra a ação; esta tela só lista." />
      <FilterChips
        ariaLabel="Filtrar por entidade"
        active={entidade}
        items={ENTIDADES.map((e) => ({
          value: e,
          label: e || "Todas",
          href: e ? `/admin/auditoria?entidade=${e}` : "/admin/auditoria",
        }))}
      />
      <Card className="mt-6 overflow-x-auto">
        {pagina.items.length === 0 ? (
          <EmptyState title="Nenhum registro" description={`${pagina.total} evento(s) no filtro atual.`} />
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-line font-mono text-[.68rem] uppercase tracking-wide text-ink-soft">
                <th className="py-2 pr-3 font-medium">Quando</th>
                <th className="py-2 pr-3 font-medium">Ação</th>
                <th className="py-2 pr-3 font-medium">Entidade</th>
                <th className="py-2 font-medium">Ator</th>
              </tr>
            </thead>
            <tbody>
              {pagina.items.map((ev) => (
                <tr key={ev.id} className="border-b border-line/70">
                  <td className="py-3 pr-3 font-mono text-xs text-ink-soft">{fmtDataHora(ev.criado_em)}</td>
                  <td className="py-3 pr-3 font-medium text-ink">{ev.acao}</td>
                  <td className="py-3 pr-3 text-ink-soft">
                    {ev.entidade}
                    {ev.entidade_id ? <span className="block truncate font-mono text-xs">{ev.entidade_id}</span> : null}
                  </td>
                  <td className="py-3 font-mono text-xs text-ink-soft">{ev.ator_id ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
