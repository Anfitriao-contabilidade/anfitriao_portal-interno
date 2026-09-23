import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import { getUsuarioEPapel } from "@/lib/admin";
import { salvarChecklistApto } from "./actions";
import { CHECKLIST_APTO_CATEGORIAS, checklistItemKey, checklistScoreInfo } from "@/lib/checklistApto";

// Checklist de prontidão do imóvel — pedido do usuário (a partir do checklist
// "Itens essenciais" que ele enviou): uma verificação de 0 a 10 de o quanto o
// imóvel está pronto para operar, marcada pelo proprietário/co-anfitrião (ou
// pela equipe, no Painel Interno — decisão: os dois podem marcar, mas cada
// sistema guarda sua própria marcação, sem sincronização).
//
// O pedido original do usuário foi "dentro da aba Clientes" — no Painel
// Interno (uso da equipe) isso significa um botão por imóvel na tabela de
// Clientes, que abre um modal. Aqui no Portal do Cliente não existe um
// equivalente 1:1 da tabela de Clientes para o próprio dono do imóvel (ele
// só vê os próprios imóveis) — por isso esta é uma aba própria no menu
// (mesmo padrão da aba "Estoque"), e o admin também vê um atalho por imóvel
// na tela /clientes. Essa colocação é uma escolha de design registrada no
// briefing, não uma instrução literal do usuário para este sistema.
//
// Sem JS no cliente: todas as ~83 checkboxes de um imóvel ficam num único
// formulário, enviado de uma vez pelo botão "Salvar checklist" — não dá
// para gravar cada checkbox individualmente como o Painel Interno faz (lá
// há JavaScript rodando no navegador; aqui os componentes são só de
// servidor).

function fmtNota(nota: number) {
  return nota.toFixed(1).replace(".", ",");
}

function NotaBadge({ nota, temChecklist }: { nota: number; temChecklist: boolean }) {
  if (!temChecklist) {
    return (
      <span className="inline-flex items-center rounded-full border border-ocean/20 bg-white px-3 py-1 text-xs font-mono font-medium text-ink-soft">
        Sem avaliação
      </span>
    );
  }
  const cls =
    nota >= 8
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : nota >= 5
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-red-50 text-red-700 border-red-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-mono font-medium ${cls}`}>
      Nota {fmtNota(nota)}
    </span>
  );
}

function ImovelChecklistBloco({
  imovel,
  itens,
  mostrarNomeImovel,
}: {
  imovel: { id: string; nome: string };
  itens: Record<string, boolean>;
  mostrarNomeImovel?: boolean;
}) {
  const info = checklistScoreInfo(itens);

  return (
    <div className="rounded-xl border border-ocean/10 bg-white p-5">
      {mostrarNomeImovel && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="font-medium text-ink">{imovel.nome}</p>
          <NotaBadge nota={info.nota} temChecklist={Object.keys(itens).length > 0} />
        </div>
      )}

      <div className="grid gap-3 border-b border-ocean/10 pb-5 sm:grid-cols-2">
        <div className="rounded-lg border border-ocean/10 bg-paper px-4 py-3">
          <p className="text-xs font-mono uppercase tracking-wide text-ink-soft">Nota de prontidão</p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink">{fmtNota(info.nota)} / 10</p>
        </div>
        <div className="rounded-lg border border-ocean/10 bg-paper px-4 py-3">
          <p className="text-xs font-mono uppercase tracking-wide text-ink-soft">Itens marcados</p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink">
            {info.totalChecados} / {info.totalItens}
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-ink-soft">
        Nota calculada com peso igual entre as 7 categorias (Quarto, Sala, Cozinha, Enxoval, Banheiro, Lavanderia,
        Serviços e itens essenciais) — cada categoria vale o mesmo na nota final, não importa quantos itens tem.
        Baseado no checklist de itens essenciais para apartamento de temporada. A equipe também pode marcar estes
        itens pelo Painel Interno (cada sistema guarda sua própria marcação).
      </p>

      <form action={salvarChecklistApto} className="mt-5">
        <input type="hidden" name="imovel_id" value={imovel.id} />

        {CHECKLIST_APTO_CATEGORIAS.map((cat, ci) => {
          const det = info.detalhes[ci];
          return (
            <div key={cat.nome} className="mt-5 first:mt-0">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-display text-base font-semibold text-ink">{cat.nome}</h3>
                <span className="text-xs text-ink-soft">
                  {det.checados}/{det.total}
                </span>
              </div>
              <ul className="space-y-1.5">
                {cat.itens.map((item, ii) => {
                  const key = checklistItemKey(ci, ii);
                  return (
                    <li key={key} className="flex items-start gap-2.5 border-b border-ocean/5 py-1.5 text-sm">
                      <input
                        type="checkbox"
                        name="item"
                        value={key}
                        defaultChecked={!!itens[key]}
                        className="mt-1"
                      />
                      <span>
                        <span className="font-medium text-ink">{item.nome}</span>
                        {item.qtd && item.qtd !== "—" ? (
                          <span className="text-ink-soft"> (sugestão: {item.qtd})</span>
                        ) : null}
                        <br />
                        <span className="text-xs text-ink-soft">{item.desc}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}

        <button
          type="submit"
          className="mt-6 w-full rounded-lg bg-ocean px-5 py-2.5 text-sm font-medium text-white hover:bg-ocean-deep sm:w-fit"
        >
          Salvar checklist
        </button>
      </form>

      {info.sugestoes.length > 0 ? (
        <div className="mt-6 border-t border-ocean/10 pt-4">
          <h3 className="font-display text-base font-semibold text-ink">
            Sugestões — por que ter os itens ainda não marcados
          </h3>
          <div className="mt-2 space-y-2">
            {info.sugestoes.map((s) => (
              <p key={s.categoria + s.item} className="rounded-lg bg-paper px-3 py-2 text-xs text-ink-soft">
                <b className="text-ink">
                  {s.categoria} · {s.item}
                </b>
                : {s.impacto}
              </p>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          Todos os itens estão marcados — prontidão máxima para este imóvel!
        </p>
      )}
    </div>
  );
}

export default async function ChecklistPage() {
  const { user, isAdmin } = await getUsuarioEPapel();
  if (!user) return null;

  const supabase = createClient();

  const imoveisQuery = isAdmin
    ? supabase.from("imoveis").select("id, nome, owner_id").order("nome", { ascending: true })
    : supabase.from("imoveis").select("id, nome, owner_id").eq("owner_id", user.id).order("nome", { ascending: true });

  const [{ data: imoveis }, clientesRes] = await Promise.all([
    imoveisQuery,
    isAdmin
      ? supabase.from("profiles").select("id, nome").eq("papel", "cliente")
      : Promise.resolve({ data: null as { id: string; nome: string }[] | null }),
  ]);

  const nomesPorCliente = new Map((clientesRes.data || []).map((c) => [c.id, c.nome]));
  const imoveisList = imoveis || [];
  const imovelIds = imoveisList.map((im) => im.id);

  const { data: checklistsData } = imovelIds.length
    ? await supabase.from("checklist_apto").select("imovel_id, itens").in("imovel_id", imovelIds)
    : { data: [] as { imovel_id: string; itens: Record<string, boolean> }[] };

  const itensPorImovel = new Map<string, Record<string, boolean>>();
  (checklistsData || []).forEach((c) => {
    itensPorImovel.set(c.imovel_id, (c.itens || {}) as Record<string, boolean>);
  });

  return (
    <>
      <NavBar />
      <div className="md:pl-60">
        <main className="mx-auto max-w-4xl px-6 py-10">
          <p className="text-sm text-ink-soft">{isAdmin ? "Equipe" : "Carteira"}</p>
          <h1 className="font-display text-2xl font-semibold text-ink">Checklist de prontidão</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Marque os itens que o imóvel já tem — o sistema calcula uma nota de 0 a 10 (peso igual entre as 7
            categorias) e sugere por que vale a pena ter os itens que faltam.
          </p>

          <div className="mt-6 space-y-4">
            {imoveisList.length === 0 && (
              <p className="rounded-lg border border-dashed border-ocean/20 p-6 text-sm text-ink-soft">
                {isAdmin ? "Nenhum imóvel cadastrado ainda." : "Você ainda não tem imóveis cadastrados."}
              </p>
            )}

            {imoveisList.length === 1 && !isAdmin ? (
              <ImovelChecklistBloco
                imovel={imoveisList[0]}
                itens={itensPorImovel.get(imoveisList[0].id) || {}}
                mostrarNomeImovel
              />
            ) : (
              imoveisList.map((im) => {
                const itens = itensPorImovel.get(im.id) || {};
                const info = checklistScoreInfo(itens);
                return (
                  <details key={im.id} id={im.id} open={!isAdmin}>
                    <summary className="cursor-pointer text-sm font-medium text-ocean hover:underline">
                      {im.nome}
                      {isAdmin ? ` · ${nomesPorCliente.get(im.owner_id) || "—"}` : ""} — nota {fmtNota(info.nota)}/10
                    </summary>
                    <div className="mt-3">
                      <ImovelChecklistBloco imovel={im} itens={itens} />
                    </div>
                  </details>
                );
              })
            )}
          </div>
        </main>
      </div>
    </>
  );
}
