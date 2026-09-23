import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import Link from "next/link";
import {
  resumoFinanceiroMes,
  ultimosNMeses,
  fmtBRL,
  fmtCompetencia,
  type Imovel,
  type Reserva,
  type Lancamento,
} from "@/lib/metrics";

// Mesma lógica de split de comissão da Home, só que com o detalhamento de
// lançamentos do período — é a versão "Financeiro" pedida para o Portal do
// Cliente espelhar a aba equivalente do Painel Interno da equipe.
export default async function FinanceiroPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: imoveisRaw }] = await Promise.all([
    supabase.from("profiles").select("perfil_atuacao").eq("id", user!.id).single(),
    supabase.from("imoveis").select("id, nome, taxa_gestao_pct").eq("owner_id", user!.id),
  ]);

  const imoveisTyped = (imoveisRaw || []) as Imovel[];
  const imovelIds = imoveisTyped.map((i) => i.id);
  const imovelNomePorId = new Map(imoveisTyped.map((i) => [i.id, i.nome]));

  const [compAtual] = ultimosNMeses(1);

  const [{ data: reservas }, { data: lancamentos }] = await Promise.all([
    imovelIds.length
      ? supabase.from("reservas").select("imovel_id, checkin, checkout, valor_bruto").in("imovel_id", imovelIds)
      : Promise.resolve({ data: [] as Reserva[] }),
    supabase
      .from("lancamentos")
      .select("id, imovel_id, tipo, categoria, valor, data")
      .eq("owner_id", user!.id)
      .order("data", { ascending: false }),
  ]);

  const reservasTyped = (reservas || []) as Reserva[];
  const lancamentosTyped = (lancamentos || []) as (Lancamento & { id: string; categoria: string })[];
  const lancamentosDoMes = lancamentosTyped.filter((l) => l.data.slice(0, 7) === compAtual);

  const resumo = resumoFinanceiroMes(imoveisTyped, reservasTyped, lancamentosTyped, compAtual);
  const ehCoAnfitriao = profile?.perfil_atuacao === "coanfitriao" || profile?.perfil_atuacao === "ambos";

  return (
    <>
      <NavBar />
      <div className="md:pl-60">
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="text-sm text-ink-soft">Financeiro</p>
            <h1 className="font-display text-2xl font-semibold text-ink">
              Repasses e split de comissão — {fmtCompetencia(compAtual)}
            </h1>
          </div>
        </div>

        {imoveisTyped.length === 0 ? (
          <p className="mt-6 rounded-lg border border-dashed border-ocean/20 bg-white p-5 text-sm text-ink-soft">
            Cadastre um imóvel na aba{" "}
            <Link href="/imoveis" className="text-ocean underline">
              Imóveis
            </Link>{" "}
            para começar a acompanhar seu financeiro aqui.
          </p>
        ) : (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-ocean/10 bg-white p-5">
                <p className="text-xs uppercase tracking-wide text-ink-soft">Faturamento do mês</p>
                <p className="mt-1 font-display text-2xl text-ink">{fmtBRL(resumo.faturamentoTotal)}</p>
              </div>
              <div className="rounded-xl border border-ocean/10 bg-white p-5">
                <p className="text-xs uppercase tracking-wide text-ink-soft">Comissão de gestão</p>
                <p className="mt-1 font-display text-2xl text-ink">{fmtBRL(resumo.comissaoGestao)}</p>
              </div>
              <div className="rounded-xl border border-ocean/10 bg-white p-5">
                <p className="text-xs uppercase tracking-wide text-ink-soft">Despesas do mês</p>
                <p className="mt-1 font-display text-2xl text-ink">{fmtBRL(resumo.despesasOperacionais)}</p>
              </div>
              <div className="rounded-xl border-l-4 border-ocean bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-ink-soft">Repasse líquido</p>
                <p className={`mt-1 font-display text-2xl ${resumo.valorLiquido < 0 ? "text-red-600" : "text-ocean"}`}>
                  {fmtBRL(resumo.valorLiquido)}
                </p>
              </div>
            </div>

            {resumo.comissaoGestao > 0 && (
              <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900">
                {ehCoAnfitriao ? (
                  <p>
                    <strong>Como Co-Anfitrião:</strong> {fmtBRL(resumo.comissaoGestao)} é o valor de referência
                    para emitir uma única nota fiscal de serviço da sua gestão em {fmtCompetencia(compAtual)} —
                    soma da comissão de todos os imóveis que você administra neste mês. A equipe gera o rascunho
                    dessa nota com esse mesmo valor — acompanhe em{" "}
                    <Link href="/notas" className="underline">
                      Notas fiscais
                    </Link>
                    .
                  </p>
                ) : (
                  <p>
                    <strong>Você está cadastrado como Proprietário</strong> — a comissão acima é a taxa que a
                    Anfitrião cobra pela gestão dos seus imóveis.
                  </p>
                )}
              </div>
            )}

            <h2 className="mt-10 text-base font-semibold text-ink">Lançamentos do período</h2>
            {lancamentosDoMes.length === 0 ? (
              <p className="mt-3 rounded-lg border border-dashed border-ocean/20 bg-white p-5 text-sm text-ink-soft">
                Nenhum lançamento registrado neste mês ainda.
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto rounded-xl border border-ocean/10 bg-white">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-ocean/10 text-xs uppercase tracking-wide text-ink-soft">
                      <th className="py-2 pl-4 pr-3">Data</th>
                      <th className="py-2 pr-3">Imóvel</th>
                      <th className="py-2 pr-3">Categoria</th>
                      <th className="py-2 pr-4 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lancamentosDoMes.map((l) => (
                      <tr key={l.id} className="border-b border-ocean/5 last:border-0">
                        <td className="py-3 pl-4 pr-3">{new Date(l.data + "T00:00:00").toLocaleDateString("pt-BR")}</td>
                        <td className="py-3 pr-3">{l.imovel_id ? imovelNomePorId.get(l.imovel_id) || "—" : "—"}</td>
                        <td className="py-3 pr-3">{l.categoria}</td>
                        <td className={`py-3 pr-4 text-right font-mono ${l.tipo === "despesa" ? "text-red-600" : "text-ocean"}`}>
                          {l.tipo === "despesa" ? "− " : "+ "}
                          {fmtBRL(l.valor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
      </div>
    </>
  );
}
