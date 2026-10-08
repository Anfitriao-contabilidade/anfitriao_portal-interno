/**
 * Tipos das respostas da Anfitrião API (espelham os schemas Pydantic em
 * anfitriao_api/app/schemas). Valores em dinheiro chegam como string decimal.
 */
export type Papel = "admin" | "proprietario" | "coanfitriao";
export type SituacaoCadastro = "pendente" | "aprovado" | "recusado";
export type Dinheiro = string;

export type Usuario = {
  id: string;
  email: string;
  nome: string;
  papeis: Papel[];
  tipo: "PF" | "PJ";
  documento: string | null;
  telefone: string | null;
  endereco: string | null;
  plano: string | null;
  status_fiscal: "regular" | "em_verificacao" | "pendencia";
  ativo: boolean;
  situacao_cadastro: SituacaoCadastro;
  origem: "equipe" | "cadastro_publico";
  email_verificado: boolean | null;
  ultimo_login_em: string | null;
  criado_em: string | null;
};

export type SessaoResposta = { sessao: string; expira_em: string; usuario: Usuario };

export type Imovel = {
  id: string;
  nome: string;
  endereco: string | null;
  taxa_gestao_pct: string;
  plataformas: string[];
  tipo: string | null;
  condicao: string | null;
  metragem: string | null;
  quartos: number | null;
  salas: number | null;
  banheiros: number | null;
  cep: string | null;
  rua: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  proprietario_id: string | null;
  proprietario_externo: { nome: string; documento: string | null; email: string | null; telefone: string | null } | null;
  coanfitriao_ids: string[];
  meu_acesso: "admin" | "proprietario" | "coanfitriao" | null;
  criado_em: string | null;
};

export type Reserva = {
  id: string;
  imovel_id: string;
  hospede: string | null;
  plataforma: string;
  checkin: string;
  checkout: string;
  valor_bruto: Dinheiro;
  noites: number | null;
};

export type Lancamento = {
  id: string;
  cliente_id: string;
  imovel_id: string | null;
  tipo: "receita" | "despesa";
  categoria: string;
  descricao: string | null;
  valor: Dinheiro;
  data: string;
  status: string;
};

export type Obrigacao = {
  id: string;
  cliente_id: string;
  tipo: string;
  descricao: string | null;
  competencia: string | null;
  vencimento: string;
  valor: Dinheiro | null;
  status: "pendente" | "pago";
  pago_em: string | null;
  situacao: string | null;
  dias_para_vencer: number | null;
};

export type NotaFiscal = {
  id: string;
  cliente_id: string;
  imovel_id: string | null;
  tipo: "hospede" | "proprietario" | "comissao";
  competencia: string | null;
  descricao_servico: string;
  valor: Dinheiro;
  tomador_nome: string | null;
  status: string;
  referencia: string;
  numero: string | null;
  url_pdf: string | null;
  erro_mensagem: string | null;
  criado_em: string | null;
};

export type EstoqueItem = {
  id: string;
  imovel_id: string;
  grupo: string;
  tipo: string;
  quantidade: number;
  nome_marca: string | null;
  valor: Dinheiro | null;
};

export type Checklist = {
  imovel_id: string;
  itens: string[];
  nota: number;
  total_checados: number;
  total_itens: number;
  atualizado_em: string | null;
};

export type ResumoFinanceiro = {
  competencia: string;
  faturamento_total: Dinheiro;
  comissao_gestao: Dinheiro;
  despesas_operacionais: Dinheiro;
  despesas_total: Dinheiro;
  valor_liquido: Dinheiro;
  ocupacao_media_pct: number;
};

export type Painel = {
  cliente_id: string;
  status_fiscal: string;
  obrigacoes_atrasadas: number;
  proximo_vencimento: string | null;
  mes_atual: ResumoFinanceiro;
  mes_anterior: ResumoFinanceiro;
  total_imoveis: number;
  imoveis_proprios: number;
  imoveis_coanfitriao: number;
};

export type LinhaRanking = {
  imovel_id: string;
  imovel_nome: string;
  faturamento_total: Dinheiro;
  comissao_total: Dinheiro;
  liquido_total: Dinheiro;
  ocupacao_media_pct: number;
};

export type MetricasMesApi = {
  competencia: string;
  valor_bruto_reservas: Dinheiro;
  valor_comissao: Dinheiro;
  despesas_deduzidas: Dinheiro;
  valor_liquido: Dinheiro;
  ocupacao_pct: number;
  noites_reservadas: number;
  dias_no_mes: number;
};

export type SerieImovel = { imovel_id: string; imovel_nome: string; meses: MetricasMesApi[] };

// ---------------------------------------------------------------------------
// Pagamentos (Asaas)
// ---------------------------------------------------------------------------
export type FormaPagamento = "indefinida" | "pix" | "boleto" | "cartao";
export type StatusCobranca = "criando" | "erro" | "pendente" | "vencida" | "paga" | "estornada" | "contestada" | "cancelada";
export type StatusAssinatura = "criando" | "erro" | "ativa" | "inativa" | "cancelada";
export type CicloAssinatura = "mensal" | "trimestral" | "semestral" | "anual";

export type Cobranca = {
  id: string;
  cliente_id: string;
  origem: "avulsa" | "assinatura";
  assinatura_id: string | null;
  descricao: string | null;
  valor: Dinheiro | null;
  valor_liquido: Dinheiro | null;
  vencimento: string | null;
  pago_em: string | null;
  forma: FormaPagamento;
  status: StatusCobranca;
  status_gateway: string | null;
  url_fatura: string | null;
  url_boleto: string | null;
  numero_fatura: string | null;
  erro_mensagem: string | null;
  criado_em: string | null;
};

export type Assinatura = {
  id: string;
  cliente_id: string;
  plano_id: string | null;
  plano_titulo: string | null;
  descricao: string | null;
  valor: Dinheiro | null;
  ciclo: CicloAssinatura;
  forma: FormaPagamento;
  proximo_vencimento: string | null;
  status: StatusAssinatura;
  erro_mensagem: string | null;
  criado_em: string | null;
};

export type PlanoVitrine = {
  id: string;
  titulo: string;
  descricao: string;
  nivel: string;
  preco_atual: Dinheiro;
  beneficios: string[];
  mais_escolhido: boolean;
};

export type ConfiguracaoPagamentos = {
  habilitado: boolean;
  ambiente: "sandbox" | "producao";
  webhook_configurado: boolean;
  webhook_path: string;
};
