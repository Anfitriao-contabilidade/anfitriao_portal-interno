import { fmtBRL, type LinhaRanking } from "@/lib/metrics";

export default function RankingTable({ linhas }: { linhas: LinhaRanking[] }) {
  if (linhas.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-ocean/20 p-6 text-sm text-ink-soft">
        Cadastre um imóvel para ver o ranking de rentabilidade aqui.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b border-ocean/10 text-xs uppercase tracking-wide text-ink-soft">
            <th className="py-2 pr-4">Imóvel</th>
            <th className="py-2 pr-4">Faturamento (6m)</th>
            <th className="py-2 pr-4">Comissão de gestão (6m)</th>
            <th className="py-2 pr-4">Líquido (6m)</th>
            <th className="py-2 pr-4">Ocupação média</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, idx) => (
            <tr key={l.imovelId} className="border-b border-ocean/5">
              <td className="py-3 pr-4 font-medium">
                {idx === 0 ? "🏆 " : ""}
                {l.imovelNome}
              </td>
              <td className="py-3 pr-4 font-mono">{fmtBRL(l.faturamentoTotal)}</td>
              <td className="py-3 pr-4 font-mono">{fmtBRL(l.comissaoTotal)}</td>
              <td className="py-3 pr-4 font-mono font-semibold text-ocean">
                {fmtBRL(l.liquidoTotal)}
              </td>
              <td className="py-3 pr-4 font-mono">{l.ocupacaoMediaPct}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
