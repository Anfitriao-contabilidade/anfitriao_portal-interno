import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import Link from "next/link";
import { ultimosNMeses, fmtBRL, fmtCompetencia } from "@/lib/metrics";

const PLATAFORMA_LABEL: Record<string, string> = {
  airbnb: "Airbnb",
  booking: "Booking",
  direta: "Reserva direta",
  outra: "Outra",
};

function fmtData(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

// Lista as reservas lançadas pela equipe (Channel Manager ainda é manual
// nesta fase) — espelha a aba "Operação" do Painel Interno, só que já
// filtrada para os imóveis do próprio cliente.
export default async function OperacaoPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: imoveis } = await supabase.from("imoveis").select("id, nome").eq("owner_id", user!.id);
  const imoveisTyped = imoveis || [];
  const imovelIds = imoveisTyped.map((i) => i.id);
  const imovelNomePorId = new Map(imoveisTyped.map((i) => [i.id, i.nome]));

  const [compAtual] = ultimosNMeses(1);

  const { data: reservas } = imovelIds.length
    ? await supabase
        .from("reservas")
        .select("id, imovel_id, hospede, plataforma, checkin, checkout, valor_bruto")
        .in("imovel_id", imovelIds)
        .order("checkin", { ascending: false })
    : { data: [] as any[] };

  const reservasTyped = (reservas || []) as {
    id: string;
    imovel_id: string;
    hospede: string | null;
    plataforma: string;
    checkin: string;
    checkout: string;
    valor_bruto: number;
  }[];

  const reservasDoMes = reservasTyped.filter((r) => r.checkin.slice(0, 7) === compAtual);

  return (
    <>
      <NavBar />
      <div className="md:pl-60">
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div>
          <p className="text-sm text-ink-soft">Operação</p>
          <h1 className="font-display text-2xl font-semibold text-ink">
            Reservas lançadas — {fmtCompetencia(compAtual)}
          </h1>
        </div>

        {imoveisTyped.length === 0 ? (
          <p className="mt-6 rounded-lg border border-dashed border-ocean/20 bg-white p-5 text-sm text-ink-soft">
            Cadastre um imóvel na aba{" "}
            <Link href="/imoveis" className="text-ocean underline">
              Imóveis
            </Link>{" "}
            para ver as reservas aqui.
          </p>
        ) : reservasDoMes.length === 0 ? (
          <p className="mt-6 rounded-lg border border-dashed border-ocean/20 bg-white p-5 text-sm text-ink-soft">
            Nenhuma reserva lançada neste mês ainda.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-xl border border-ocean/10 bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-ocean/10 text-xs uppercase tracking-wide text-ink-soft">
                  <th className="py-2 pl-4 pr-3">Imóvel</th>
                  <th className="py-2 pr-3">Hóspede</th>
                  <th className="py-2 pr-3">Plataforma</th>
                  <th className="py-2 pr-3">Check-in / Check-out</th>
                  <th className="py-2 pr-4 text-right">Valor bruto</th>
                </tr>
              </thead>
              <tbody>
                {reservasDoMes.map((r) => (
                  <tr key={r.id} className="border-b border-ocean/5 last:border-0">
                    <td className="py-3 pl-4 pr-3 font-medium">{imovelNomePorId.get(r.imovel_id) || "—"}</td>
                    <td className="py-3 pr-3">{r.hospede || "—"}</td>
                    <td className="py-3 pr-3">{PLATAFORMA_LABEL[r.plataforma] || r.plataforma}</td>
                    <td className="py-3 pr-3">
                      {fmtData(r.checkin)} – {fmtData(r.checkout)}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono">{fmtBRL(r.valor_bruto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      </div>
    </>
  );
}
