import type { Metadata } from "next";
import { Building2, ChevronDown } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { api, apiPagina } from "@/lib/api";
import { listarImoveis, listarUsuarios, nomeDoResponsavel } from "@/lib/data";
import type { Checklist } from "@/lib/tipos";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { NotaChecklistBadge } from "@/components/domain/badges";
import { ChecklistForm } from "./ChecklistForm";

export const metadata: Metadata = { title: "Checklist de prontidão" };

export default async function ChecklistPage() {
  const sessao = await requireUser();
  const [lista, checklists, usuarios] = await apiPagina(() =>
    Promise.all([
      listarImoveis(),
      api<Checklist[]>("/checklist"),
      sessao.isAdmin ? listarUsuarios() : Promise.resolve([]),
    ])
  );
  const nomeCliente = new Map(usuarios.map((c) => [c.id, c.nome]));
  // A API devolve a lista de chaves marcadas e a nota já calculada.
  const porImovel = new Map(checklists.map((c) => [c.imovel_id, c]));

  return (
    <>
      <PageHeader
        eyebrow={sessao.isAdmin ? "Equipe" : "Operação & financeiro"}
        title="Checklist de prontidão"
        description="Marque o que o imóvel já tem. A nota de 0 a 10 é recalculada na hora e mostramos por que vale a pena ter os itens que faltam."
      />

      {lista.length === 0 ? (
        <EmptyState icon={<Building2 className="h-5 w-5" />} title="Nenhum imóvel cadastrado" action={<ButtonLink href="/imoveis">Cadastrar imóvel</ButtonLink>} />
      ) : (
        <div className="space-y-4">
          {lista.map((im) => {
            const ck = porImovel.get(im.id);
            const itens: Record<string, boolean> = Object.fromEntries((ck?.itens ?? []).map((k) => [k, true]));
            return (
              <details key={im.id} id={`imovel-${im.id}`} open={lista.length === 1} className="group/imovel scroll-mt-24 rounded-2xl border border-line bg-white shadow-card">
                <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-2xl px-5 py-3 hover:bg-paper/60 sm:px-6">
                  <span className="min-w-0">
                    <span className="block truncate font-display text-base font-semibold text-ink">{im.nome}</span>
                    {sessao.isAdmin && <span className="block truncate text-xs text-ink-soft">{nomeDoResponsavel(im, nomeCliente)}</span>}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <NotaChecklistBadge nota={ck?.nota ?? 0} avaliado={(ck?.itens.length ?? 0) > 0} />
                    <ChevronDown className="h-4 w-4 text-ink-soft transition-transform group-open/imovel:rotate-180" aria-hidden />
                  </span>
                </summary>
                <div className="border-t border-line px-5 py-5 sm:px-6">
                  <ChecklistForm imovelId={im.id} inicial={itens} />
                </div>
              </details>
            );
          })}
        </div>
      )}
    </>
  );
}
