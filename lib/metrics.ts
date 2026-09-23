// Cálculos de rentabilidade/ocupação por imóvel — porta para o Portal do Cliente
// da mesma lógica já usada e testada no Painel Interno da equipe (calcRepasse),
// para que os números batam entre as duas ferramentas.

export type Imovel = {
  id: string;
  nome: string;
  taxa_gestao_pct: number;
};

export type Reserva = {
  imovel_id: string;
  checkin: string; // 'YYYY-MM-DD'
  checkout: string; // 'YYYY-MM-DD'
  valor_bruto: number;
};

export type Lancamento = {
  imovel_id: string | null;
  tipo: "receita" | "despesa";
  valor: number;
  data: string; // 'YYYY-MM-DD'
};

export type MetricasMes = {
  competencia: string; // 'YYYY-MM'
  valorBrutoReservas: number;
  valorComissao: number;
  despesasDeduzidas: number;
  valorLiquido: number;
  ocupacaoPct: number;
  noitesReservadas: number;
  diasNoMes: number;
};

export function ultimosNMeses(n: number, referencia: Date = new Date()): string[] {
  const arr: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const dt = new Date(Date.UTC(referencia.getUTCFullYear(), referencia.getUTCMonth() - i, 1));
    arr.push(dt.toISOString().slice(0, 7));
  }
  return arr;
}

export function diasNoMes(competencia: string): number {
  const [y, m] = competencia.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function noitesReservadasNoMes(reservas: Reserva[], imovelId: string, competencia: string): number {
  const [y, m] = competencia.split("-").map(Number);
  const inicioMes = `${competencia}-01`;
  const fimMes = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);

  let noites = 0;
  for (const r of reservas) {
    if (r.imovel_id !== imovelId) continue;
    const start = r.checkin > inicioMes ? r.checkin : inicioMes;
    const end = r.checkout < fimMes ? r.checkout : fimMes;
    const n = (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000;
    if (n > 0) noites += n;
  }
  return noites;
}

/** Métricas de um imóvel numa competência (mês) específica. */
export function metricasImovelMes(
  imovel: Imovel,
  reservas: Reserva[],
  lancamentos: Lancamento[],
  competencia: string
): MetricasMes {
  const valorBrutoReservas = reservas
    .filter((r) => r.imovel_id === imovel.id && r.checkin.slice(0, 7) === competencia)
    .reduce((sum, r) => sum + (r.valor_bruto || 0), 0);

  const valorComissao = valorBrutoReservas * (imovel.taxa_gestao_pct / 100);

  const despesasDeduzidas = lancamentos
    .filter(
      (l) => l.tipo === "despesa" && l.imovel_id === imovel.id && l.data.slice(0, 7) === competencia
    )
    .reduce((sum, l) => sum + (l.valor || 0), 0);

  const dias = diasNoMes(competencia);
  const noites = noitesReservadasNoMes(reservas, imovel.id, competencia);

  return {
    competencia,
    valorBrutoReservas,
    valorComissao,
    despesasDeduzidas,
    valorLiquido: valorBrutoReservas - valorComissao - despesasDeduzidas,
    ocupacaoPct: dias ? Math.round((noites / dias) * 100) : 0,
    noitesReservadas: noites,
    diasNoMes: dias,
  };
}

/** Série dos últimos N meses (default 6) para um imóvel — base do gráfico e da tabela. */
export function serieMensalImovel(
  imovel: Imovel,
  reservas: Reserva[],
  lancamentos: Lancamento[],
  nMeses = 6
): MetricasMes[] {
  return ultimosNMeses(nMeses).map((competencia) =>
    metricasImovelMes(imovel, reservas, lancamentos, competencia)
  );
}

export type LinhaRanking = {
  imovelId: string;
  imovelNome: string;
  faturamentoTotal: number;
  /** Comissão de gestão acumulada no período — mesmo detalhamento por imóvel que o
   *  Painel Interno da equipe mostra no "Split de comissão". */
  comissaoTotal: number;
  liquidoTotal: number;
  ocupacaoMediaPct: number;
};

/** Ranking dos imóveis do cliente pelo lucro líquido acumulado nos últimos N meses. */
export function rankingImoveis(
  imoveis: Imovel[],
  reservas: Reserva[],
  lancamentos: Lancamento[],
  nMeses = 6
): LinhaRanking[] {
  const linhas = imoveis.map((imovel) => {
    const serie = serieMensalImovel(imovel, reservas, lancamentos, nMeses);
    const faturamentoTotal = serie.reduce((s, m) => s + m.valorBrutoReservas, 0);
    const comissaoTotal = serie.reduce((s, m) => s + m.valorComissao, 0);
    const liquidoTotal = serie.reduce((s, m) => s + m.valorLiquido, 0);
    const totalNoites = serie.reduce((s, m) => s + m.noitesReservadas, 0);
    const totalDias = serie.reduce((s, m) => s + m.diasNoMes, 0);
    return {
      imovelId: imovel.id,
      imovelNome: imovel.nome,
      faturamentoTotal,
      comissaoTotal,
      liquidoTotal,
      ocupacaoMediaPct: totalDias ? Math.round((totalNoites / totalDias) * 100) : 0,
    };
  });
  linhas.sort((a, b) => b.liquidoTotal - a.liquidoTotal);
  return linhas;
}

export type ResumoFinanceiroMes = {
  competencia: string;
  faturamentoTotal: number;
  /** Comissão de gestão do período (soma de todos os imóveis) — o que a Anfitrião (ou o
   *  Co-Anfitrião, quando é ele quem administra os imóveis) recebe pela gestão. Mesmo
   *  número que aparece como "Split de comissão" no Painel Interno da equipe. */
  comissaoGestao: number;
  /** Despesas lançadas (do(s) imóvel(is) + gerais do negócio), SEM contar a comissão de
   *  gestão — separado dela para o cliente não confundir "quanto gastei" com "quanto a
   *  gestão reteve". */
  despesasOperacionais: number;
  /** Soma de comissaoGestao + despesasOperacionais — mantido por compatibilidade com quem
   *  só quer o total de saídas do período. */
  despesasTotal: number;
  valorLiquido: number;
  ocupacaoMediaPct: number;
};

/**
 * Resumo consolidado de TODOS os imóveis do cliente numa competência — usado na
 * Home do Portal do Cliente para dar a "saúde financeira" do negócio de forma
 * agregada, sem precisar entrar em Rentabilidade e olhar imóvel por imóvel.
 *
 * Também soma lançamentos avulsos sem imóvel vinculado (ex.: honorários de
 * contabilidade, despesas administrativas do negócio como um todo) — esses
 * antes não apareciam em nenhum lugar do Portal do Cliente.
 *
 * A comissão de gestão vem destacada à parte (comissaoGestao) — é o mesmo valor que,
 * agregado por competência, serve de referência para o Co-Anfitrião emitir uma nota
 * fiscal de serviço única (ver "Split de comissão" no Painel Interno da equipe).
 */
export function resumoFinanceiroMes(
  imoveis: Imovel[],
  reservas: Reserva[],
  lancamentos: Lancamento[],
  competencia: string
): ResumoFinanceiroMes {
  let faturamentoReservas = 0;
  let comissaoGestao = 0;
  let despesasImoveis = 0;
  let totalNoites = 0;
  let totalDias = 0;

  for (const imovel of imoveis) {
    const m = metricasImovelMes(imovel, reservas, lancamentos, competencia);
    faturamentoReservas += m.valorBrutoReservas;
    comissaoGestao += m.valorComissao;
    despesasImoveis += m.despesasDeduzidas;
    totalNoites += m.noitesReservadas;
    totalDias += m.diasNoMes;
  }

  const lancamentosGerais = lancamentos.filter(
    (l) => !l.imovel_id && l.data.slice(0, 7) === competencia
  );
  const receitasGerais = lancamentosGerais
    .filter((l) => l.tipo === "receita")
    .reduce((s, l) => s + (l.valor || 0), 0);
  const despesasGerais = lancamentosGerais
    .filter((l) => l.tipo === "despesa")
    .reduce((s, l) => s + (l.valor || 0), 0);

  const faturamentoTotal = faturamentoReservas + receitasGerais;
  const despesasOperacionais = despesasImoveis + despesasGerais;
  const despesasTotal = comissaoGestao + despesasOperacionais;

  return {
    competencia,
    faturamentoTotal,
    comissaoGestao,
    despesasOperacionais,
    despesasTotal,
    valorLiquido: faturamentoTotal - despesasTotal,
    ocupacaoMediaPct: totalDias ? Math.round((totalNoites / totalDias) * 100) : 0,
  };
}

export function fmtBRL(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function fmtCompetencia(competencia: string): string {
  const [y, m] = competencia.split("-").map(Number);
  const nomes = [
    "jan",
    "fev",
    "mar",
    "abr",
    "mai",
    "jun",
    "jul",
    "ago",
    "set",
    "out",
    "nov",
    "dez",
  ];
  return `${nomes[m - 1]}/${String(y).slice(2)}`;
}
