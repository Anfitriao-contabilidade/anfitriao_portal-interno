import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import BarChart from "@/components/BarChart";
import RankingTable from "@/components/RankingTable";
import {
  rankingImoveis,
  serieMensalImovel,
  fmtBRL,
  type Imovel,
  type Reserva,
  type Lancamento,
} from "@/lib/metrics";

export default async function RentabilidadePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: imoveis } = await supabase
    .from("imoveis")
    .select("id, nome, taxa_gestao_pct")
    .eq("owner_id", user!.id);

  const imovelIds = (imoveis || []).map((i) => i.id);

  const [{ data: reservas }, { data: lancamentos }] = await Promise.all([
    imovelIds.length
      ? supabase.from("reservas").select("imovel_id, checkin, checkout, valor_bruto").in("imovel_id", imovelIds)
      : Promise.resolve({ data: [] as Reserva[] }),
    supabase
      .from("lancamentos")
      .select("imovel_id, tipo, valor, data")
      .eq("owner_id", user!.id),
  ]);

  const imoveisTyped = (imoveis || []) as Imovel[];
  const reservasTyped = (reservas || []) as Reserva[];
  const lancamentosTyped = (lancamentos || []) as Lancamento[];

  const ranking = rankingImoveis(imoveisTyped, reservasTyped, lancamentosTyped, 6);
  const imovelDestaque = imoveisTyped.find((i) => i.id === ranking[0]?.imovelId);
  const serieDestaque = imovelDestaque
    ? serieMensalImovel(imovelDestaque, reservasTyped, lancamentosTyped, 6)
    : [];

  return (
    <>
      <NavBar />
      <div className="md:pl-60">
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Rentabilidade</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Faturamento e lucratividade real dos seus imóveis nos últimos 6 meses — já
          descontando a taxa de gestão e as despesas lançadas pela contabilidade.
        </p>

        <section className="mt-8 rounded-2xl border border-ocean/10 bg-white p-6">
          <h2 className="font-display text-lg font-semibold text-ink">
            Ranking dos seus imóveis
          </h2>
          <div className="mt-4">
            <RankingTable linhas={ranking} />
          </div>
        </section>

        {imovelDestaque && (
          <section className="mt-6 rounded-2xl border border-ocean/10 bg-white p-6">
            <h2 className="font-display text-lg font-semibold text-ink">
              Desempenho mensal — {imovelDestaque.nome}
            </h2>
            <p className="text-sm text-ink-soft">
              Lucro líquido mês a mês (imóvel com melhor resultado acumulado).
            </p>
            <BarChart serie={serieDestaque} />
            <p className="mt-2 text-xs text-ink-soft">
              Melhor mês:{" "}
              {
                serieDestaque.reduce((a, b) => (b.valorLiquido > a.valorLiquido ? b : a)).competencia
              }{" "}
              ({fmtBRL(Math.max(...serieDestaque.map((m) => m.valorLiquido)))})
            </p>
          </section>
        )}

        {imoveisTyped.length === 0 && (
          <p className="mt-6 rounded-lg border border-dashed border-ocean/20 p-6 text-sm text-ink-soft">
            Cadastre um imóvel na aba Imóveis para começar a acompanhar sua rentabilidade.
          </p>
        )}
      </main>
      </div>
    </>
  );
}
