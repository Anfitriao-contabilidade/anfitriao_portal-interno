import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import { getUsuarioEPapel } from "@/lib/admin";
import { adicionarItemEstoque, excluirItemEstoque } from "./actions";

// Estoque por imóvel — o que cada apartamento tem (enxoval, cozinha, sala,
// banheiro, materiais de limpeza etc.), com quantidade, nome/marca e um
// valor de referência. Espelha a aba "Estoque" do Painel Interno (rascunho
// do usuário: Clientes → Imóveis → Estoque), com as mesmas decisões de
// escopo: aba própria (não embutida no cadastro do imóvel) e Valor é só
// informativo — não aparece em nenhum cálculo de Financeiro/Rentabilidade.
//
// Diferente do Painel Interno (onde a equipe escolhe cliente/imóvel em dois
// selects em cascata com JS), este Portal é só componentes de servidor — em
// vez de um seletor, cada imóvel aparece como uma seção própria (aberta se
// for o único imóvel do cliente, ou dentro de um <details> quando há mais
// de um ou quando é a equipe vendo vários clientes).
//
// Grupo e Tipo são campos de texto livre com sugestões (via <datalist>) —
// dá para digitar um valor da lista semente OU um nome novo, sem precisar
// de JavaScript no cliente para "revelar" um campo (o mesmo resultado do
// select "+ Novo grupo/tipo…" do Painel Interno, adaptado à arquitetura
// deste app).
const GRUPOS_SEED = ["Enxoval", "Cozinha", "Sala", "Banheiro", "Materiais de limpeza"];
const TIPOS_SEED = ["Lençol", "Edredom", "Toalha", "Louça", "Eletrodoméstico", "Utensílios", "Armário", "TV"];

type ItemEstoque = {
  id: string;
  imovel_id: string;
  grupo: string;
  tipo: string;
  quantidade: number;
  nome_marca: string | null;
  valor: number | null;
};

function fmtBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ImovelEstoqueBloco({
  imovel,
  itens,
  gruposSugeridos,
  tiposSugeridos,
  mostrarNomeImovel,
}: {
  imovel: { id: string; nome: string };
  itens: ItemEstoque[];
  gruposSugeridos: string[];
  tiposSugeridos: string[];
  // Quando o bloco é exibido dentro de um <details>, o nome do imóvel (e do
  // dono, se admin) já aparece no <summary> — nesse caso não repetimos o
  // cabeçalho aqui dentro para não duplicar a informação.
  mostrarNomeImovel?: boolean;
}) {
  const porGrupo = new Map<string, ItemEstoque[]>();
  itens.forEach((it) => {
    const lista = porGrupo.get(it.grupo) || [];
    lista.push(it);
    porGrupo.set(it.grupo, lista);
  });
  const grupos = Array.from(porGrupo.keys()).sort((a, b) => a.localeCompare(b));
  const total = itens.reduce((soma, it) => soma + (it.valor || 0), 0);
  const datalistGrupoId = `grupos-${imovel.id}`;
  const datalistTipoId = `tipos-${imovel.id}`;

  return (
    <div className="rounded-xl border border-ocean/10 bg-white p-5">
      {mostrarNomeImovel && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="font-medium text-ink">{imovel.nome}</p>
          <span className="text-xs text-ink-soft">{itens.length} item(ns)</span>
        </div>
      )}

      {grupos.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-ocean/20 p-4 text-sm text-ink-soft">
          Nenhum item de estoque cadastrado ainda.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {grupos.map((g) => (
            <div key={g}>
              <p className="mb-1.5 text-xs font-semibold text-ink-soft">
                {g} ({(porGrupo.get(g) || []).length})
              </p>
              <ul className="space-y-2">
                {(porGrupo.get(g) || [])
                  .slice()
                  .sort((a, b) => a.tipo.localeCompare(b.tipo))
                  .map((it) => (
                    <li
                      key={it.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ocean/10 bg-paper px-3 py-2 text-sm"
                    >
                      <span>
                        <span className="font-medium text-ink">{it.tipo}</span>
                        {it.nome_marca ? <span className="text-ink-soft"> · {it.nome_marca}</span> : null}
                        <span className="text-ink-soft">
                          {" "}
                          · Qtd. {it.quantidade}
                          {it.valor ? ` · ${fmtBRL(it.valor)}` : ""}
                        </span>
                      </span>
                      <form action={excluirItemEstoque}>
                        <input type="hidden" name="id" value={it.id} />
                        <button
                          type="submit"
                          className="rounded-md border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50"
                        >
                          Excluir
                        </button>
                      </form>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
          <p className="border-t border-ocean/10 pt-3 text-xs text-ink-soft">
            Valor total do estoque deste imóvel (informativo): <strong className="text-ink">{fmtBRL(total)}</strong>
          </p>
        </div>
      )}

      <form action={adicionarItemEstoque} className="mt-5 grid gap-3 border-t border-ocean/10 pt-4 sm:grid-cols-2">
        <input type="hidden" name="imovel_id" value={imovel.id} />
        <div>
          <label className="mb-1 block text-xs font-medium">Grupo</label>
          <input
            name="grupo"
            list={datalistGrupoId}
            required
            placeholder="Ex.: Enxoval"
            className="w-full rounded-lg border border-ocean/20 px-3 py-2 text-sm"
          />
          <datalist id={datalistGrupoId}>
            {gruposSugeridos.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Tipo</label>
          <input
            name="tipo"
            list={datalistTipoId}
            required
            placeholder="Ex.: Lençol"
            className="w-full rounded-lg border border-ocean/20 px-3 py-2 text-sm"
          />
          <datalist id={datalistTipoId}>
            {tiposSugeridos.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Quantidade</label>
          <input
            name="quantidade"
            type="number"
            min={1}
            step={1}
            defaultValue={1}
            className="w-full rounded-lg border border-ocean/20 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Nome / marca</label>
          <input
            name="nome_marca"
            placeholder="Ex.: Buddemeyer 200 fios"
            className="w-full rounded-lg border border-ocean/20 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Valor (R$)</label>
          <input
            name="valor"
            type="number"
            min={0}
            step="0.01"
            placeholder="Opcional"
            className="w-full rounded-lg border border-ocean/20 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded-lg bg-ocean px-5 py-2.5 text-sm font-medium text-white hover:bg-ocean-deep sm:w-fit"
          >
            + Adicionar item
          </button>
        </div>
      </form>
    </div>
  );
}

export default async function EstoquePage() {
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

  const { data: itensData } = imovelIds.length
    ? await supabase.from("estoque_itens").select("*").in("imovel_id", imovelIds)
    : { data: [] as ItemEstoque[] };
  const itens = (itensData || []) as ItemEstoque[];

  const itensPorImovel = new Map<string, ItemEstoque[]>();
  itens.forEach((it) => {
    const lista = itensPorImovel.get(it.imovel_id) || [];
    lista.push(it);
    itensPorImovel.set(it.imovel_id, lista);
  });

  const gruposUsados = Array.from(new Set(itens.map((it) => it.grupo)));
  const tiposUsados = Array.from(new Set(itens.map((it) => it.tipo)));
  const gruposSugeridos = Array.from(new Set([...GRUPOS_SEED, ...gruposUsados]));
  const tiposSugeridos = Array.from(new Set([...TIPOS_SEED, ...tiposUsados]));

  return (
    <>
      <NavBar />
      <div className="md:pl-60">
        <main className="mx-auto max-w-4xl px-6 py-10">
          <p className="text-sm text-ink-soft">{isAdmin ? "Equipe" : "Carteira"}</p>
          <h1 className="font-display text-2xl font-semibold text-ink">Estoque</h1>
          <p className="mt-1 text-sm text-ink-soft">
            O que cada imóvel tem — enxoval, cozinha, sala, banheiro, materiais de limpeza etc. O valor é só de
            referência (patrimonial): não entra no Financeiro, na Rentabilidade nem em nenhum repasse.
          </p>

          <div className="mt-6 space-y-4">
            {imoveisList.length === 0 && (
              <p className="rounded-lg border border-dashed border-ocean/20 p-6 text-sm text-ink-soft">
                {isAdmin ? "Nenhum imóvel cadastrado ainda." : "Você ainda não tem imóveis cadastrados."}
              </p>
            )}

            {imoveisList.length === 1 && !isAdmin ? (
              <ImovelEstoqueBloco
                imovel={imoveisList[0]}
                itens={itensPorImovel.get(imoveisList[0].id) || []}
                gruposSugeridos={gruposSugeridos}
                tiposSugeridos={tiposSugeridos}
                mostrarNomeImovel
              />
            ) : (
              imoveisList.map((im) => (
                <details key={im.id} open={!isAdmin}>
                  <summary className="cursor-pointer text-sm font-medium text-ocean hover:underline">
                    {im.nome}
                    {isAdmin ? ` · ${nomesPorCliente.get(im.owner_id) || "—"}` : ""} (
                    {(itensPorImovel.get(im.id) || []).length} item(ns))
                  </summary>
                  <div className="mt-3">
                    <ImovelEstoqueBloco
                      imovel={im}
                      itens={itensPorImovel.get(im.id) || []}
                      gruposSugeridos={gruposSugeridos}
                      tiposSugeridos={tiposSugeridos}
                    />
                  </div>
                </details>
              ))
            )}
          </div>
        </main>
      </div>
    </>
  );
}
