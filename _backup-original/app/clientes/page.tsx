import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import StatusBadge from "@/components/StatusBadge";
import { getUsuarioEPapel } from "@/lib/admin";
import { atualizarCliente } from "./actions";
import { checklistScoreInfo } from "@/lib/checklistApto";

function ChecklistNotaChip({ nota, temChecklist }: { nota: number; temChecklist: boolean }) {
  if (!temChecklist) {
    return (
      <span className="rounded-full border border-ocean/20 bg-white px-2 py-0.5 text-[.68rem] font-mono text-ink-soft">
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
    <span className={`rounded-full border px-2 py-0.5 text-[.68rem] font-mono font-medium ${cls}`}>
      Nota {nota.toFixed(1).replace(".", ",")}
    </span>
  );
}

const PERFIL_LABEL: Record<string, string> = {
  proprietario: "Proprietário",
  coanfitriao: "Co-Anfitrião",
  ambos: "Proprietário + Co-Anfitrião",
};

const PERFIL_BADGE_STYLE: Record<string, string> = {
  proprietario: "bg-ocean/5 text-ocean border-ocean/20",
  coanfitriao: "bg-gold/10 text-gold border-gold/30",
  ambos: "bg-gold/10 text-gold border-gold/30",
};

type FiltroAtuacao = "todos" | "propria" | "terceiros";

function PerfilBadge({ perfil }: { perfil: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-mono font-medium ${
        PERFIL_BADGE_STYLE[perfil] || PERFIL_BADGE_STYLE.proprietario
      }`}
    >
      {PERFIL_LABEL[perfil] || "Proprietário"}
    </span>
  );
}

// Espelha a aba "Clientes" do Painel Interno da equipe — nesta primeira leva
// só com os campos essenciais do cadastro (nome/tipo/documento/contato/
// plano/perfil/status fiscal) + filtro por atuação, já que o resto (CNAE,
// sócios extraídos por IA, checklist de documentos) fica para uma etapa
// seguinte (decisão do usuário). Só a equipe (papel=admin) enxerga esta
// tela — listar todos os clientes da carteira aqui, para um cliente comum,
// vazaria dados de outros clientes.
export default async function ClientesPage({
  searchParams,
}: {
  searchParams: { atuacao?: string };
}) {
  const { isAdmin } = await getUsuarioEPapel();

  if (!isAdmin) {
    return (
      <>
        <NavBar />
        <div className="md:pl-60">
        <main className="mx-auto max-w-3xl px-6 py-10">
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
            Esta página é restrita à equipe da Anfitrião.
          </p>
        </main>
        </div>
      </>
    );
  }

  const supabase = createClient();

  const [{ data: clientes }, { data: imoveis }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, nome, tipo, documento, telefone, endereco, plano, status_fiscal, perfil_atuacao")
      .eq("papel", "cliente")
      .order("nome", { ascending: true }),
    supabase.from("imoveis").select("id, nome, owner_id"),
  ]);

  const clientesTyped = clientes || [];
  const imoveisPorCliente = new Map<string, { id: string; nome: string }[]>();
  for (const im of imoveis || []) {
    const lista = imoveisPorCliente.get(im.owner_id) || [];
    lista.push({ id: im.id, nome: im.nome });
    imoveisPorCliente.set(im.owner_id, lista);
  }

  // Nota do checklist de prontidão por imóvel (mesma fonte/fórmula da aba
  // "Checklist de prontidão") — só um atalho aqui na tela de Clientes, o
  // preenchimento em si acontece na aba própria.
  const imovelIdsTodos = (imoveis || []).map((im) => im.id);
  const { data: checklistsData } = imovelIdsTodos.length
    ? await supabase.from("checklist_apto").select("imovel_id, itens").in("imovel_id", imovelIdsTodos)
    : { data: [] as { imovel_id: string; itens: Record<string, boolean> }[] };
  const checklistItensPorImovel = new Map<string, Record<string, boolean>>();
  (checklistsData || []).forEach((c) => {
    checklistItensPorImovel.set(c.imovel_id, (c.itens || {}) as Record<string, boolean>);
  });

  const filtro: FiltroAtuacao =
    searchParams?.atuacao === "propria" || searchParams?.atuacao === "terceiros"
      ? (searchParams.atuacao as FiltroAtuacao)
      : "todos";

  const clientesFiltrados = clientesTyped.filter((c) => {
    const perfil = c.perfil_atuacao || "proprietario";
    if (filtro === "propria") return perfil === "proprietario" || perfil === "ambos";
    if (filtro === "terceiros") return perfil === "coanfitriao" || perfil === "ambos";
    return true;
  });

  const chipClass = (ativo: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-xs font-mono font-medium ${
      ativo ? "border-ocean bg-ocean text-white" : "border-ocean/20 bg-white text-ink-soft hover:text-ocean"
    }`;

  return (
    <>
      <NavBar />
      <div className="md:pl-60">
      <main className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-sm text-ink-soft">Equipe</p>
        <h1 className="font-display text-2xl font-semibold text-ink">Clientes</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Carteira de clientes da Anfitrião. Perfil e CNAE/sócios/documentos completos continuam no Painel
          Interno por enquanto — aqui é o essencial do cadastro, editável direto pelo Portal.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <a href="/clientes?atuacao=todos" className={chipClass(filtro === "todos")}>
            Todos ({clientesTyped.length})
          </a>
          <a href="/clientes?atuacao=propria" className={chipClass(filtro === "propria")}>
            Conta própria (
            {clientesTyped.filter((c) => (c.perfil_atuacao || "proprietario") !== "coanfitriao").length})
          </a>
          <a href="/clientes?atuacao=terceiros" className={chipClass(filtro === "terceiros")}>
            Administra para terceiros (
            {
              clientesTyped.filter((c) => c.perfil_atuacao === "coanfitriao" || c.perfil_atuacao === "ambos")
                .length
            }
            )
          </a>
        </div>

        <ul className="mt-6 space-y-3">
          {clientesFiltrados.map((c) => {
            const imoveisDoCliente = imoveisPorCliente.get(c.id) || [];
            return (
              <li key={c.id} className="rounded-xl border border-ocean/10 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink">{c.nome}</p>
                    <p className="text-sm text-ink-soft">
                      {c.tipo} {c.documento ? `· ${c.documento}` : ""} {c.telefone ? `· ${c.telefone}` : ""}
                    </p>
                    {imoveisDoCliente.length === 0 ? (
                      <p className="mt-1 text-xs text-ink-soft">Nenhum imóvel cadastrado</p>
                    ) : (
                      <div className="mt-2 flex flex-col gap-1.5">
                        {imoveisDoCliente.map((im) => {
                          const itensImovel = checklistItensPorImovel.get(im.id) || {};
                          const info = checklistScoreInfo(itensImovel);
                          return (
                            <div key={im.id} className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="text-ink-soft">{im.nome}</span>
                              <ChecklistNotaChip nota={info.nota} temChecklist={Object.keys(itensImovel).length > 0} />
                              <Link href={`/checklist#${im.id}`} className="text-ocean hover:underline">
                                Checklist de prontidão
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <PerfilBadge perfil={c.perfil_atuacao || "proprietario"} />
                    <StatusBadge status={(c.status_fiscal as any) || "regular"} />
                  </div>
                </div>

                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-medium text-ocean hover:underline">
                    Editar cadastro
                  </summary>
                  <form
                    action={atualizarCliente}
                    className="mt-4 grid gap-4 border-t border-ocean/10 pt-4 sm:grid-cols-2"
                  >
                    <input type="hidden" name="id" value={c.id} />
                    <div>
                      <label className="mb-1 block text-sm font-medium">Nome / Razão social</label>
                      <input
                        name="nome"
                        defaultValue={c.nome || ""}
                        required
                        className="w-full rounded-lg border border-ocean/20 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Tipo</label>
                      <select
                        name="tipo"
                        defaultValue={c.tipo || "PF"}
                        className="w-full rounded-lg border border-ocean/20 px-3 py-2 text-sm"
                      >
                        <option value="PF">Pessoa Física</option>
                        <option value="PJ">Pessoa Jurídica</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">CPF / CNPJ</label>
                      <input
                        name="documento"
                        defaultValue={c.documento || ""}
                        className="w-full rounded-lg border border-ocean/20 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Telefone</label>
                      <input
                        name="telefone"
                        defaultValue={c.telefone || ""}
                        className="w-full rounded-lg border border-ocean/20 px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-sm font-medium">Endereço</label>
                      <input
                        name="endereco"
                        defaultValue={c.endereco || ""}
                        className="w-full rounded-lg border border-ocean/20 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Plano</label>
                      <input
                        name="plano"
                        defaultValue={c.plano || ""}
                        placeholder="Básico, Padrão, Experts Essencial…"
                        className="w-full rounded-lg border border-ocean/20 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Status fiscal</label>
                      <select
                        name="status_fiscal"
                        defaultValue={c.status_fiscal || "regular"}
                        className="w-full rounded-lg border border-ocean/20 px-3 py-2 text-sm"
                      >
                        <option value="regular">Regular</option>
                        <option value="em_verificacao">Em verificação</option>
                        <option value="pendencia">Pendência</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-sm font-medium">Perfil</label>
                      <select
                        name="perfil_atuacao"
                        defaultValue={c.perfil_atuacao || "proprietario"}
                        className="w-full rounded-lg border border-ocean/20 px-3 py-2 text-sm"
                      >
                        <option value="proprietario">Proprietário</option>
                        <option value="coanfitriao">Co-Anfitrião</option>
                        <option value="ambos">Proprietário + Co-Anfitrião</option>
                      </select>
                      <p className="mt-1 text-xs text-ink-soft">
                        Define se o Portal mostra o aviso de nota fiscal única de Co-Anfitrião na Home/Financeiro
                        deste cliente.
                      </p>
                    </div>
                    <button
                      type="submit"
                      className="rounded-lg bg-ocean px-5 py-2.5 text-sm font-medium text-white hover:bg-ocean-deep sm:col-span-2 sm:w-fit"
                    >
                      Salvar alterações
                    </button>
                  </form>
                </details>
              </li>
            );
          })}
          {clientesFiltrados.length === 0 && (
            <p className="rounded-lg border border-dashed border-ocean/20 p-6 text-sm text-ink-soft">
              Nenhum cliente encontrado com esse filtro.
            </p>
          )}
        </ul>
      </main>
      </div>
    </>
  );
}
