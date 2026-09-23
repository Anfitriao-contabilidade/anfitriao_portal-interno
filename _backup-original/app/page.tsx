import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import StatusBadge from "@/components/StatusBadge";
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

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: imoveis }, { data: obrigacoes }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).single(),
    supabase.from("imoveis").select("id, nome, taxa_gestao_pct").eq("owner_id", user!.id),
    supabase
      .from("obrigacoes_fiscais")
      .select("*")
      .eq("owner_id", user!.id)
      .eq("status", "pendente")
      .order("vencimento", { ascending: true }),
  ]);

  const imoveisTyped = (imoveis || []) as Imovel[];
  const imovelIds = imoveisTyped.map((i) => i.id);

  const [{ data: reservas }, { data: lancamentos }] = await Promise.all([
    imovelIds.length
      ? supabase.from("reservas").select("imovel_id, checkin, checkout, valor_bruto").in("imovel_id", imovelIds)
      : Promise.resolve({ data: [] as Reserva[] }),
    supabase.from("lancamentos").select("imovel_id, tipo, valor, data").eq("owner_id", user!.id),
  ]);

  const reservasTyped = (reservas || []) as Reserva[];
  const lancamentosTyped = (lancamentos || []) as Lancamento[];

  const [compAnterior, compAtual] = ultimosNMeses(2);
  const resumoAtual = resumoFinanceiroMes(imoveisTyped, reservasTyped, lancamentosTyped, compAtual);
  const resumoAnterior = resumoFinanceiroMes(imoveisTyped, reservasTyped, lancamentosTyped, compAnterior);
  const variacaoLiquido =
    resumoAnterior.valorLiquido !== 0
      ? Math.round(
          ((resumoAtual.valorLiquido - resumoAnterior.valorLiquido) / Math.abs(resumoAnterior.valorLiquido)) * 100
        )
      : null;

  const hoje = new Date().toISOString().slice(0, 10);
  const atrasadas = (obrigacoes || []).filter((o) => o.vencimento < hoje);
  const statusExibido = atrasadas.length > 0 ? "pendencia" : profile?.status_fiscal || "regular";
  const ehCoAnfitriao = profile?.perfil_atuacao === "coanfitriao" || profile?.perfil_atuacao === "ambos";

  return (
    <>
      <NavBar />
      <div className="md:pl-60">
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-ink-soft">Olá,</p>
            <h1 className="font-display text-2xl font-semibold text-ink">
              {profile?.nome || "cliente Anfitrião"}
            </h1>
          </div>
          <StatusBadge status={statusExibido} />
        </div>

        <section className="mt-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-lg font-semibold text-ink">
              Saúde financeira — {fmtCompetencia(compAtual)}
            </h2>
            <Link href="/rentabilidade" className="text-xs text-ocean underline">
              Ver por imóvel
            </Link>
          </div>

          {imoveisTyped.length === 0 ? (
            <p className="mt-3 rounded-lg border border-dashed border-ocean/20 bg-white p-5 text-sm text-ink-soft">
              Cadastre um imóvel na aba{" "}
              <Link href="/imoveis" className="text-ocean underline">
                Imóveis
              </Link>{" "}
              para começar a acompanhar a saúde financeira do negócio aqui.
            </p>
          ) : (
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-ocean/10 bg-white p-5">
                <p className="text-xs uppercase tracking-wide text-ink-soft">Faturamento do mês</p>
                <p className="mt-1 font-display text-2xl text-ink">{fmtBRL(resumoAtual.faturamentoTotal)}</p>
                <p className="mt-1 text-xs text-ink-soft">reservas + receitas lançadas</p>
              </div>
              <div className="rounded-xl border border-ocean/10 bg-white p-5">
                <p className="text-xs uppercase tracking-wide text-ink-soft">Comissão de gestão</p>
                <p className="mt-1 font-display text-2xl text-ink">{fmtBRL(resumoAtual.comissaoGestao)}</p>
                <p className="mt-1 text-xs text-ink-soft">retida pela gestão dos seus imóveis</p>
              </div>
              <div className="rounded-xl border border-ocean/10 bg-white p-5">
                <p className="text-xs uppercase tracking-wide text-ink-soft">Despesas do mês</p>
                <p className="mt-1 font-display text-2xl text-ink">{fmtBRL(resumoAtual.despesasOperacionais)}</p>
                <p className="mt-1 text-xs text-ink-soft">despesas lançadas (sem contar a comissão acima)</p>
              </div>
              <div className="rounded-xl border-l-4 border-ocean bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-ink-soft">Repasse líquido</p>
                <p
                  className={`mt-1 font-display text-2xl ${
                    resumoAtual.valorLiquido < 0 ? "text-red-600" : "text-ocean"
                  }`}
                >
                  {fmtBRL(resumoAtual.valorLiquido)}
                </p>
                <p className="mt-1 text-xs text-ink-soft">
                  {resumoAtual.ocupacaoMediaPct}% de ocupação média
                  {variacaoLiquido !== null && (
                    <>
                      {" "}
                      ·{" "}
                      <span className={variacaoLiquido >= 0 ? "text-green-700" : "text-red-600"}>
                        {variacaoLiquido >= 0 ? "▲" : "▼"} {Math.abs(variacaoLiquido)}%
                      </span>{" "}
                      vs {fmtCompetencia(compAnterior)}
                    </>
                  )}
                </p>
              </div>
            </div>
          )}
          {imoveisTyped.length > 0 && resumoAtual.comissaoGestao > 0 && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900">
              {ehCoAnfitriao ? (
                <p>
                  <strong>Como Co-Anfitrião:</strong> {fmtBRL(resumoAtual.comissaoGestao)} é o valor de
                  referência para emitir uma única nota fiscal de serviço da sua gestão em{" "}
                  {fmtCompetencia(compAtual)} — soma da comissão de todos os imóveis que você administra
                  neste mês. O restante ({fmtBRL(resumoAtual.valorLiquido)}) é do(s) proprietário(s), que
                  declaram esse valor recebido por fora dessa nota. Veja o detalhamento por imóvel em{" "}
                  <Link href="/rentabilidade" className="underline">
                    Rentabilidade
                  </Link>
                  .
                </p>
              ) : (
                <p>
                  <strong>Você está cadastrado como Proprietário</strong> — a comissão de gestão acima é a
                  taxa que a Anfitrião cobra por administrar seus imóveis, não uma comissão de Co-Anfitrião
                  a repassar a terceiros. Se você também administra imóveis de outras pessoas, fale com a
                  equipe da Anfitrião para ajustar seu perfil em{" "}
                  <Link href="/perfil" className="underline">
                    Perfil
                  </Link>
                  .
                </p>
              )}
            </div>
          )}
        </section>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-ocean/10 bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-ink-soft">Imóveis cadastrados</p>
            <p className="mt-1 font-display text-3xl text-ocean">{imoveis?.length ?? 0}</p>
            <Link href="/imoveis" className="mt-2 inline-block text-xs text-ocean underline">
              Gerenciar imóveis
            </Link>
          </div>
          <div className="rounded-xl border border-ocean/10 bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-ink-soft">Obrigações em aberto</p>
            <p className="mt-1 font-display text-3xl text-ocean">{obrigacoes?.length ?? 0}</p>
            <Link href="/impostos" className="mt-2 inline-block text-xs text-ocean underline">
              Ver impostos
            </Link>
          </div>
          <div className="rounded-xl border border-ocean/10 bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-ink-soft">Já vencidas</p>
            <p className={`mt-1 font-display text-3xl ${atrasadas.length ? "text-red-600" : "text-ocean"}`}>
              {atrasadas.length}
            </p>
            <Link href="/impostos" className="mt-2 inline-block text-xs text-ocean underline">
              Ver impostos
            </Link>
          </div>
        </div>

        {atrasadas.length > 0 && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            Você tem {atrasadas.length} obrigação(ões) vencida(s). Veja os detalhes na aba{" "}
            <Link href="/impostos" className="underline">
              Impostos
            </Link>
            .
          </div>
        )}
      </main>
      </div>
    </>
  );
}
