import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = { title: "Fechamento mensal" };

type Fechamento = {
  id: string;
  competencia: string;
  concluido: boolean;
  notas_ok: boolean;
  despesas_ok: boolean;
  competencia_anterior_ok: boolean;
};

export default async function FechamentoCliente() {
  const itens = await api<Fechamento[]>("/fechamentos");
  return (
    <>
      <PageHeader eyebrow="Operação & financeiro" title="Fechamento mensal" description="A equipe confirma notas, despesas e o mês anterior. Aqui você acompanha o status." />
      {itens.length === 0 ? (
        <EmptyState title="Nenhum fechamento publicado" description="Quando a equipe encerrar um mês, ele aparece nesta lista." />
      ) : (
        <ul className="flex flex-col gap-3">
          {itens.map((f) => (
            <li key={f.id} className="rounded-card border border-line bg-raised px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-sm text-ink">{f.competencia}</p>
                <Badge tone={f.concluido ? "success" : "warning"}>{f.concluido ? "Concluído" : "Em aberto"}</Badge>
              </div>
              <p className="mt-2 text-xs text-ink-soft">
                Notas {f.notas_ok ? "ok" : "pendente"} · Despesas {f.despesas_ok ? "ok" : "pendente"} · Mês anterior {f.competencia_anterior_ok ? "ok" : "pendente"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
