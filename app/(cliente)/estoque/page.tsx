import type { Metadata } from "next";
import { Building2, ChevronDown, Package } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { apiPagina, api, num } from "@/lib/api";
import { listarImoveis, listarUsuarios, nomeDoResponsavel } from "@/lib/data";
import { fmtBRL } from "@/lib/metrics";
import type { EstoqueItem } from "@/lib/tipos";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { ConfirmDelete } from "@/components/forms/ConfirmDelete";
import { EstoqueForm } from "./EstoqueForm";
import { excluirItemEstoque } from "./actions";

export const metadata: Metadata = { title: "Estoque" };

const GRUPOS_SEED = ["Enxoval", "Cozinha", "Sala", "Banheiro", "Materiais de limpeza"];
const TIPOS_SEED = ["Lençol", "Edredom", "Toalha", "Louça", "Eletrodoméstico", "Utensílios", "Armário", "TV"];

type Item = EstoqueItem;

export default async function EstoquePage() {
  const sessao = await requireUser();
  const [lista, itens, usuarios] = await apiPagina(() =>
    Promise.all([
      listarImoveis(),
      api<Item[]>("/estoque"),
      sessao.isAdmin ? listarUsuarios() : Promise.resolve([]),
    ])
  );
  const nomeCliente = new Map(usuarios.map((c) => [c.id, c.nome]));

  const grupos = Array.from(new Set([...GRUPOS_SEED, ...itens.map((i) => i.grupo)]));
  const tipos = Array.from(new Set([...TIPOS_SEED, ...itens.map((i) => i.tipo)]));

  return (
    <>
      <PageHeader
        eyebrow={sessao.isAdmin ? "Equipe" : "Operação & financeiro"}
        title="Estoque"
        description="O que cada imóvel tem — enxoval, cozinha, sala, banheiro, limpeza. O valor é só referência patrimonial: não entra em Financeiro nem em repasses."
      />

      {lista.length === 0 ? (
        <EmptyState icon={<Building2 className="h-5 w-5" />} title="Nenhum imóvel cadastrado" action={<ButtonLink href="/imoveis">Cadastrar imóvel</ButtonLink>} />
      ) : (
        <div className="space-y-4">
          {lista.map((im) => {
            const doImovel = itens.filter((i) => i.imovel_id === im.id);
            const porGrupo = new Map<string, Item[]>();
            doImovel.forEach((i) => porGrupo.set(i.grupo, [...(porGrupo.get(i.grupo) ?? []), i]));
            const total = doImovel.reduce((s, i) => s + num(i.valor), 0);
            return (
              <details key={im.id} open={lista.length === 1} className="group rounded-2xl border border-line bg-white shadow-card">
                <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-2xl px-5 py-3 hover:bg-paper/60 sm:px-6">
                  <span className="min-w-0">
                    <span className="block truncate font-display text-base font-semibold text-ink">{im.nome}</span>
                    {sessao.isAdmin && <span className="block truncate text-xs text-ink-soft">{nomeDoResponsavel(im, nomeCliente)}</span>}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <Badge tone="info">{doImovel.length} item(ns)</Badge>
                    <ChevronDown className="h-4 w-4 text-ink-soft transition-transform group-open:rotate-180" aria-hidden />
                  </span>
                </summary>

                <div className="border-t border-line px-5 py-5 sm:px-6">
                  {doImovel.length === 0 ? (
                    <EmptyState icon={<Package className="h-5 w-5" />} title="Nenhum item cadastrado" description="Use o formulário abaixo para registrar o que o imóvel tem." />
                  ) : (
                    <div className="space-y-5">
                      {Array.from(porGrupo.keys())
                        .sort((a, b) => a.localeCompare(b))
                        .map((g) => (
                          <div key={g}>
                            <h3 className="mb-2 font-mono text-[.7rem] font-semibold uppercase tracking-[.12em] text-ink-soft">
                              {g} · {porGrupo.get(g)!.length}
                            </h3>
                            <ul className="divide-y divide-line rounded-xl border border-line">
                              {porGrupo
                                .get(g)!
                                .sort((a, b) => a.tipo.localeCompare(b.tipo))
                                .map((it) => (
                                  <li key={it.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0 text-sm">
                                      <span className="font-medium text-ink">{it.tipo}</span>
                                      {it.nome_marca && <span className="text-ink-soft"> · {it.nome_marca}</span>}
                                      <span className="ml-2 font-mono text-xs text-ink-soft">
                                        ×{it.quantidade}
                                        {it.valor ? ` · ${fmtBRL(num(it.valor))}` : ""}
                                      </span>
                                    </div>
                                    <ConfirmDelete action={excluirItemEstoque} id={it.id} extra={{ imovel_id: im.id }} label="Excluir" confirmLabel="Excluir" />
                                  </li>
                                ))}
                            </ul>
                          </div>
                        ))}
                      <p className="text-right text-sm text-ink-soft">
                        Valor total (informativo): <strong className="font-mono tabular-nums text-ink">{fmtBRL(total)}</strong>
                      </p>
                    </div>
                  )}

                  <Card className="mt-6 bg-paper/60 shadow-none">
                    <h3 className="mb-4 text-sm font-semibold text-ink">Adicionar item</h3>
                    <EstoqueForm imovelId={im.id} grupos={grupos} tipos={tipos} />
                  </Card>
                </div>
              </details>
            );
          })}
        </div>
      )}
    </>
  );
}
