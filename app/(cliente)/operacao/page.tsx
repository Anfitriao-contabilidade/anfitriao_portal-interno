import type { Metadata } from "next";
import { Building2, CalendarDays } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { apiPagina, apiTodos, num } from "@/lib/api";
import { fimDoMes, listarImoveis } from "@/lib/data";
import { ultimosNMeses, fmtBRL, fmtCompetencia } from "@/lib/metrics";
import type { Reserva } from "@/lib/tipos";
import { fmtData } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Operação" };

const PLATAFORMA: Record<string, string> = { airbnb: "Airbnb", booking: "Booking", direta: "Direta", outra: "Outra" };

function noites(r: Reserva) {
  return r.noites ?? Math.round((Date.parse(`${r.checkout}T00:00:00Z`) - Date.parse(`${r.checkin}T00:00:00Z`)) / 86400000);
}

export default async function OperacaoPage() {
  await requireUser();
  const [comp] = ultimosNMeses(1);
  const [lista, doMes] = await apiPagina(() =>
    Promise.all([listarImoveis(), apiTodos<Reserva>("/reservas", { de: `${comp}-01`, ate: fimDoMes(comp) })])
  );
  const nome = new Map(lista.map((i) => [i.id, i.nome]));
  const reservas = doMes.sort((a, b) => a.checkin.localeCompare(b.checkin));
  const total = reservas.reduce((s, r) => s + num(r.valor_bruto), 0);

  return (
    <>
      <PageHeader
        eyebrow="Operação & financeiro"
        title={`Reservas — ${fmtCompetencia(comp)}`}
        description="Reservas lançadas pela equipe (Channel Manager) para os seus imóveis."
        actions={reservas.length > 0 ? <Badge tone="info">{reservas.length} reserva(s) · {fmtBRL(total)}</Badge> : undefined}
      />

      {lista.length === 0 ? (
        <EmptyState icon={<Building2 className="h-5 w-5" />} title="Cadastre um imóvel para ver as reservas" action={<ButtonLink href="/imoveis">Ir para Imóveis</ButtonLink>} />
      ) : reservas.length === 0 ? (
        <EmptyState icon={<CalendarDays className="h-5 w-5" />} title="Nenhuma reserva neste mês ainda" description="Assim que a equipe lançar as reservas, elas aparecem aqui." />
      ) : (
        <>
          <ul className="grid gap-3 md:hidden">
            {reservas.map((r) => (
              <Card as="li" key={r.id} className="p-4 sm:p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{nome.get(r.imovel_id) ?? "—"}</p>
                    <p className="truncate text-sm text-ink-soft">{r.hospede || "Hóspede não informado"}</p>
                  </div>
                  <Badge tone="gold">{PLATAFORMA[r.plataforma] ?? r.plataforma}</Badge>
                </div>
                <div className="mt-3 flex items-end justify-between gap-3 border-t border-line pt-3">
                  <p className="font-mono text-xs text-ink-soft">
                    {fmtData(r.checkin, { day: "2-digit", month: "2-digit" })} → {fmtData(r.checkout, { day: "2-digit", month: "2-digit" })} · {noites(r)} noite(s)
                  </p>
                  <p className="font-mono text-sm font-medium tabular-nums text-ink">{fmtBRL(num(r.valor_bruto))}</p>
                </div>
              </Card>
            ))}
          </ul>
          <Card className="hidden overflow-x-auto p-0 sm:p-0 md:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Reservas de {fmtCompetencia(comp)}</caption>
              <thead>
                <tr className="border-b border-line bg-paper/60 text-xs uppercase tracking-wide text-ink-soft">
                  <th scope="col" className="py-3 pl-6 pr-3 font-medium">Imóvel</th>
                  <th scope="col" className="py-3 pr-3 font-medium">Hóspede</th>
                  <th scope="col" className="py-3 pr-3 font-medium">Plataforma</th>
                  <th scope="col" className="py-3 pr-3 font-medium">Período</th>
                  <th scope="col" className="py-3 pr-6 text-right font-medium">Valor bruto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {reservas.map((r) => (
                  <tr key={r.id} className="hover:bg-paper/50">
                    <td className="py-3 pl-6 pr-3 font-medium">{nome.get(r.imovel_id) ?? "—"}</td>
                    <td className="py-3 pr-3">{r.hospede || "—"}</td>
                    <td className="py-3 pr-3"><Badge tone="gold">{PLATAFORMA[r.plataforma] ?? r.plataforma}</Badge></td>
                    <td className="py-3 pr-3 font-mono text-xs">
                      {fmtData(r.checkin, { day: "2-digit", month: "2-digit" })} – {fmtData(r.checkout, { day: "2-digit", month: "2-digit" })}
                      <span className="text-ink-soft"> · {noites(r)}n</span>
                    </td>
                    <td className="py-3 pr-6 text-right font-mono tabular-nums">{fmtBRL(num(r.valor_bruto))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-line bg-paper/60 font-medium">
                  <td colSpan={4} className="py-3 pl-6">Total do mês</td>
                  <td className="py-3 pr-6 text-right font-mono tabular-nums">{fmtBRL(total)}</td>
                </tr>
              </tfoot>
            </table>
          </Card>
        </>
      )}
    </>
  );
}
