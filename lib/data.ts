import "server-only";
import { api, apiTodos, num } from "@/lib/api";
import type { MetricasMes } from "@/lib/metrics";
import type { Imovel, SerieImovel, Usuario } from "@/lib/tipos";

/** Todos os imóveis que o usuário enxerga (próprios, como co-anfitrião ou — admin — todos). */
export function listarImoveis() {
  return apiTodos<Imovel>("/imoveis");
}

/** Usuários (somente admin) — nomes para as telas da equipe. */
export function listarUsuarios(query: Record<string, string> = {}) {
  return apiTodos<Usuario>("/usuarios", query);
}

export function nomeDoResponsavel(im: Imovel, nomes: Map<string, string>) {
  if (im.proprietario_id) return nomes.get(im.proprietario_id) ?? "—";
  if (im.proprietario_externo) return `${im.proprietario_externo.nome} (sem conta)`;
  return "—";
}

/** Série mensal da API no formato usado pelo gráfico (mesmos nomes de lib/metrics.ts). */
export async function serieDoImovel(imovelId: string, meses = 6): Promise<MetricasMes[]> {
  const s = await api<SerieImovel>(`/imoveis/${imovelId}/rentabilidade`, { query: { meses } });
  return s.meses.map((m) => ({
    competencia: m.competencia,
    valorBrutoReservas: num(m.valor_bruto_reservas),
    valorComissao: num(m.valor_comissao),
    despesasDeduzidas: num(m.despesas_deduzidas),
    valorLiquido: num(m.valor_liquido),
    ocupacaoPct: m.ocupacao_pct,
    noitesReservadas: m.noites_reservadas,
    diasNoMes: m.dias_no_mes,
  }));
}

/** Último dia (AAAA-MM-DD) da competência AAAA-MM. */
export function fimDoMes(competencia: string) {
  const [y, m] = competencia.split("-").map(Number);
  const d = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${competencia}-${String(d).padStart(2, "0")}`;
}
