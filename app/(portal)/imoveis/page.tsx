import type { Metadata } from "next";
import { Building2, ChevronDown, MapPin, Plus, UserPlus, Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { api, apiPagina, num } from "@/lib/api";
import { listarImoveis, listarUsuarios } from "@/lib/data";
import type { Imovel as ImovelApi } from "@/lib/tipos";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDelete } from "@/components/forms/ConfirmDelete";
import { ActionForm } from "@/components/forms/ActionForm";
import { InputField } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { ImovelForm, type ImovelDados } from "./ImovelForm";
import { adicionarImovel, desvincularCoanfitriao, editarImovel, excluirImovel, vincularCoanfitriao } from "./actions";

export const metadata: Metadata = { title: "Imóveis" };

type Imovel = ImovelDados & {
  id: string;
  nome: string;
  endereco: string | null;
  taxa_gestao_pct: number;
  acesso: ImovelApi["meu_acesso"];
  proprietarioExterno: string | null;
  gestorPrincipal: boolean;
  coanfitrioes: { id: string; nome: string; email: string }[];
};

function paraTela(im: ImovelApi, coanfitrioes: Imovel["coanfitrioes"]): Imovel {
  const gestorPrincipal = im.meu_acesso === "admin" || im.meu_acesso === "proprietario" || (im.meu_acesso === "coanfitriao" && !im.proprietario_id);
  return {
    ...im,
    taxa_gestao_pct: num(im.taxa_gestao_pct),
    metragem: im.metragem != null ? num(im.metragem) : null,
    acesso: im.meu_acesso,
    proprietarioExterno: im.proprietario_externo?.nome ?? null,
    gestorPrincipal,
    coanfitrioes,
  };
}

function plural(n: number, s: string, p: string) {
  return `${n} ${n === 1 ? s : p}`;
}

export default async function ImoveisPage() {
  const sessao = await requireUser();
  const lista = await apiPagina(async () => {
    const imoveis = await listarImoveis();
    // Nomes dos co-anfitriões só para quem pode gerenciá-los (proprietário/equipe).
    return Promise.all(
      imoveis.map(async (im) =>
        paraTela(
          im,
          im.coanfitriao_ids.length && (im.meu_acesso === "proprietario" || im.meu_acesso === "admin")
            ? await api<Imovel["coanfitrioes"]>(`/imoveis/${im.id}/coanfitrioes`)
            : []
        )
      )
    );
  });
  const terceiro = sessao.isAdmin ? "opcional" : sessao.isCoanfitriao ? (sessao.isProprietario ? "opcional" : "obrigatorio") : "nao";
  const proprietarios = sessao.isAdmin
    ? (await apiPagina(() => listarUsuarios({ papel: "proprietario", ativo: "true" }))).map((u) => ({ id: u.id, nome: u.nome }))
    : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Carteira"
        title="Imóveis"
        description="Imóveis de temporada que você possui ou administra. A taxa de gestão alimenta a Rentabilidade; tipo, metragem e cômodos alimentam o checklist e o estoque."
        actions={
          <a href="#novo-imovel" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-ocean px-5 text-sm font-medium text-white shadow-sm hover:bg-ocean-deep">
            <Plus className="h-4 w-4" aria-hidden /> Novo imóvel
          </a>
        }
      />

      {lista.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-5 w-5" />}
          title="Você ainda não tem imóveis cadastrados"
          description="Use o formulário abaixo para cadastrar o primeiro."
        />
      ) : (
        <ul className="grid gap-4 xl:grid-cols-2">
          {lista.map((im) => {
            const chips = [
              im.tipo,
              im.condicao,
              im.metragem != null ? `${Number(im.metragem).toLocaleString("pt-BR")} m²` : null,
              im.quartos != null ? plural(im.quartos, "quarto", "quartos") : null,
              im.salas != null ? plural(im.salas, "sala", "salas") : null,
              im.banheiros != null ? plural(im.banheiros, "banheiro", "banheiros") : null,
            ].filter(Boolean) as string[];
            return (
              <Card as="li" key={im.id} className="flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-lg font-semibold text-ink">{im.nome}</h2>
                    <p className="mt-1 flex items-start gap-1.5 text-sm text-ink-soft">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                      <span>{im.endereco || "Sem endereço cadastrado"}</span>
                    </p>
                    {im.acesso === "coanfitriao" && (
                      <p className="mt-1 text-xs text-ink-soft">
                        Você é Co-Anfitrião{im.proprietarioExterno ? ` · proprietário: ${im.proprietarioExterno}` : ""}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge tone="info">{im.taxa_gestao_pct.toLocaleString("pt-BR")}% gestão</Badge>
                    {im.acesso === "coanfitriao" && <Badge tone="gold">Co-Anfitrião</Badge>}
                  </div>
                </div>

                {(chips.length > 0 || (im.plataformas?.length ?? 0) > 0) && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {chips.map((c) => (
                      <Badge key={c}>{c}</Badge>
                    ))}
                    {im.plataformas?.map((p) => (
                      <Badge key={p} tone="gold">
                        {p}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex flex-1 flex-col justify-end">
                  <details className="group rounded-xl border border-line bg-paper/60 open:bg-white">
                    <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-xl px-4 text-sm font-medium text-ocean hover:bg-ocean-50">
                      Editar dados do imóvel
                      <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
                    </summary>
                    <div className="border-t border-line p-4">
                      <ImovelForm action={editarImovel} imovel={im} submitLabel="Salvar alterações" taxaEditavel={im.gestorPrincipal} />

                      {(im.acesso === "proprietario" || im.acesso === "admin") && (
                        <div className="mt-6 border-t border-line pt-4">
                          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                            <Users className="h-4 w-4 text-ink-soft" aria-hidden /> Co-anfitriões
                          </h3>
                          {im.coanfitrioes.length === 0 ? (
                            <p className="mt-1 text-xs text-ink-soft">Nenhum co-anfitrião vinculado.</p>
                          ) : (
                            <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
                              {im.coanfitrioes.map((c) => (
                                <li key={c.id} className="flex flex-col gap-2 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                                  <span className="min-w-0 truncate">
                                    {c.nome} <span className="text-ink-soft">· {c.email}</span>
                                  </span>
                                  <ConfirmDelete action={desvincularCoanfitriao} id={c.id} extra={{ imovel_id: im.id }} label="Remover" confirmLabel="Remover" />
                                </li>
                              ))}
                            </ul>
                          )}
                          <ActionForm action={vincularCoanfitriao} resetOnSuccess className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                            <input type="hidden" name="id" value={im.id} />
                            <InputField label="E-mail do co-anfitrião" name="email" type="email" maxLength={254} required className="flex-1" hint="A pessoa precisa ter conta aprovada como Co-Anfitrião." />
                            <SubmitButton variant="secondary" pendingLabel="Vinculando…">
                              <UserPlus className="h-4 w-4" aria-hidden /> Vincular
                            </SubmitButton>
                          </ActionForm>
                        </div>
                      )}

                      {im.gestorPrincipal && (
                        <div className="mt-6 flex flex-col gap-2 border-t border-red-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-xs text-ink-soft">Remover apaga também estoque e checklist deste imóvel.</p>
                          <ConfirmDelete action={excluirImovel} id={im.id} label="Remover imóvel" description="Esta ação não pode ser desfeita." />
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              </Card>
            );
          })}
        </ul>
      )}

      <Card as="section" id="novo-imovel" className="mt-8 scroll-mt-24">
        <CardHeader title="Adicionar imóvel" description="Só o nome é obrigatório — os demais dados podem ser completados depois." />
        <ImovelForm action={adicionarImovel} submitLabel="Cadastrar imóvel" terceiro={terceiro} proprietarios={proprietarios} />
      </Card>
    </>
  );
}
