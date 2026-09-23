import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import { adicionarImovel, editarImovel, excluirImovel } from "./actions";

const TIPOS = ["Apartamento", "Studio/Flat", "Casa", "Outro"];
const CONDICOES = ["Novo", "Semi-novo", "Usado"];
const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

type Imovel = {
  id: string;
  nome: string;
  endereco: string | null;
  taxa_gestao_pct: number;
  plataformas: string[] | null;
  tipo: string | null;
  condicao: string | null;
  metragem: number | null;
  quartos: number | null;
  salas: number | null;
  banheiros: number | null;
  cep: string | null;
  rua: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
};

function inputCls() {
  return "w-full rounded-lg border border-ocean/20 px-3 py-2 text-sm";
}

function CamposEnderecoEDetalhes({ im, prefix }: { im?: Partial<Imovel>; prefix: string }) {
  return (
    <>
      <div className="sm:col-span-2">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Endereço
        </p>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">CEP</label>
        <input name="cep" defaultValue={im?.cep || ""} className={inputCls()} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Rua/Av.</label>
        <input name="rua" defaultValue={im?.rua || ""} className={inputCls()} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Número</label>
        <input name="numero" defaultValue={im?.numero || ""} className={inputCls()} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Bairro</label>
        <input name="bairro" defaultValue={im?.bairro || ""} className={inputCls()} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Cidade</label>
        <input name="cidade" defaultValue={im?.cidade || ""} className={inputCls()} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">UF</label>
        <select name="uf" defaultValue={im?.uf || ""} className={inputCls()}>
          <option value="">UF</option>
          {UFS.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2 mt-2">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Detalhes do imóvel
        </p>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Tipo</label>
        <select name="tipo" defaultValue={im?.tipo || ""} className={inputCls()}>
          <option value="">Tipo do imóvel</option>
          {TIPOS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Estado de conservação</label>
        <select name="condicao" defaultValue={im?.condicao || ""} className={inputCls()}>
          <option value="">Estado de conservação</option>
          {CONDICOES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Metragem (m²)</label>
        <input name="metragem" type="number" min={0} step="1" defaultValue={im?.metragem ?? ""} className={inputCls()} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Quartos</label>
        <input name="quartos" type="number" min={0} step="1" defaultValue={im?.quartos ?? ""} className={inputCls()} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Salas</label>
        <input name="salas" type="number" min={0} step="1" defaultValue={im?.salas ?? ""} className={inputCls()} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Banheiros</label>
        <input name="banheiros" type="number" min={0} step="1" defaultValue={im?.banheiros ?? ""} className={inputCls()} />
      </div>
    </>
  );
}

export default async function ImoveisPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: imoveis } = await supabase
    .from("imoveis")
    .select("*")
    .eq("owner_id", user!.id)
    .order("criado_em", { ascending: true });

  const lista = (imoveis || []) as Imovel[];

  return (
    <>
      <NavBar />
      <div className="md:pl-60">
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Imóveis</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Cadastre seus imóveis de temporada. A taxa de gestão é usada para calcular
          sua rentabilidade real na aba Rentabilidade. O tipo, a metragem e os
          cômodos alimentam o checklist de prontidão e o cadastro de estoque.
        </p>

        <ul className="mt-6 space-y-3">
          {lista.map((im) => (
            <li
              key={im.id}
              className="rounded-xl border border-ocean/10 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{im.nome}</p>
                  <p className="text-sm text-ink-soft">{im.endereco || "sem endereço cadastrado"}</p>
                  <p className="mt-1 font-mono text-xs text-ink-soft">
                    Taxa de gestão: {im.taxa_gestao_pct}%
                    {im.plataformas?.length ? ` · ${im.plataformas.join(", ")}` : ""}
                  </p>
                  {(im.tipo || im.condicao || im.metragem || im.quartos || im.salas || im.banheiros) && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {im.tipo && (
                        <span className="rounded-full bg-sky-50 px-2.5 py-0.5 font-mono text-[11px] text-ocean">
                          {im.tipo}
                        </span>
                      )}
                      {im.condicao && (
                        <span className="rounded-full bg-sky-50 px-2.5 py-0.5 font-mono text-[11px] text-ocean">
                          {im.condicao}
                        </span>
                      )}
                      {im.metragem != null && (
                        <span className="rounded-full bg-sky-50 px-2.5 py-0.5 font-mono text-[11px] text-ocean">
                          {im.metragem} m²
                        </span>
                      )}
                      {im.quartos != null && (
                        <span className="rounded-full bg-sky-50 px-2.5 py-0.5 font-mono text-[11px] text-ocean">
                          {im.quartos} quarto{im.quartos === 1 ? "" : "s"}
                        </span>
                      )}
                      {im.salas != null && (
                        <span className="rounded-full bg-sky-50 px-2.5 py-0.5 font-mono text-[11px] text-ocean">
                          {im.salas} sala{im.salas === 1 ? "" : "s"}
                        </span>
                      )}
                      {im.banheiros != null && (
                        <span className="rounded-full bg-sky-50 px-2.5 py-0.5 font-mono text-[11px] text-ocean">
                          {im.banheiros} banheiro{im.banheiros === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <form action={excluirImovel}>
                  <input type="hidden" name="id" value={im.id} />
                  <button
                    type="submit"
                    className="rounded-md border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                  >
                    Remover
                  </button>
                </form>
              </div>

              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-medium text-ocean hover:underline">
                  Editar dados do imóvel
                </summary>
                <form
                  action={editarImovel}
                  className="mt-3 grid gap-4 rounded-lg border border-ocean/10 bg-paper p-4 sm:grid-cols-2"
                >
                  <input type="hidden" name="id" value={im.id} />
                  <div>
                    <label className="mb-1 block text-sm font-medium">Nome</label>
                    <input name="nome" required defaultValue={im.nome} className={inputCls()} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Taxa de gestão (%)</label>
                    <input
                      name="taxa_gestao_pct"
                      type="number"
                      step="0.5"
                      min={0}
                      max={100}
                      defaultValue={im.taxa_gestao_pct}
                      className={inputCls()}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium">
                      Plataformas (separadas por vírgula)
                    </label>
                    <input
                      name="plataformas"
                      defaultValue={im.plataformas?.join(", ") || ""}
                      className={inputCls()}
                    />
                  </div>
                  <CamposEnderecoEDetalhes im={im} prefix="edit" />
                  <button
                    type="submit"
                    className="mt-1 rounded-lg bg-ocean px-5 py-2.5 text-sm font-medium text-white hover:bg-ocean-deep sm:col-span-2 sm:w-fit"
                  >
                    Salvar alterações
                  </button>
                </form>
              </details>
            </li>
          ))}
          {lista.length === 0 && (
            <p className="rounded-lg border border-dashed border-ocean/20 p-6 text-sm text-ink-soft">
              Você ainda não tem imóveis cadastrados.
            </p>
          )}
        </ul>

        <form
          action={adicionarImovel}
          className="mt-8 grid gap-4 rounded-2xl border border-ocean/10 bg-white p-6 sm:grid-cols-2"
        >
          <h2 className="font-display text-lg font-semibold text-ink sm:col-span-2">
            Adicionar imóvel
          </h2>
          <div>
            <label className="mb-1 block text-sm font-medium">Nome</label>
            <input
              name="nome"
              required
              placeholder="Ex.: Vista Mar"
              className={inputCls()}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Taxa de gestão (%)</label>
            <input
              name="taxa_gestao_pct"
              type="number"
              step="0.5"
              min={0}
              max={100}
              defaultValue={18}
              className={inputCls()}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">
              Plataformas (separadas por vírgula)
            </label>
            <input
              name="plataformas"
              placeholder="airbnb, booking"
              className={inputCls()}
            />
          </div>
          <CamposEnderecoEDetalhes prefix="novo" />
          <button
            type="submit"
            className="mt-1 rounded-lg bg-ocean px-5 py-2.5 text-sm font-medium text-white hover:bg-ocean-deep sm:col-span-2 sm:w-fit"
          >
            Adicionar
          </button>
        </form>
      </main>
      </div>
    </>
  );
}
