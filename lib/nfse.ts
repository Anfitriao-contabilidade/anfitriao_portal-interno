/** Tipos e rótulos da NFS-e Nacional (espelham app/schemas/nfse.py da API). Sem dependências de servidor. */

export type Ambiente = "homologacao" | "producao";

export type StatusNfse =
  | "rascunho"
  | "pronta"
  | "processando"
  | "autorizada"
  | "rejeitada"
  | "falha_comunicacao"
  | "situacao_desconhecida"
  | "cancelada"
  | "substituida"
  | "descartada"
  | "erro";

export type Pendencia = { etapa: string; campo: string; mensagem: string };
export type Mensagem = { codigo: string | null; descricao: string; complemento: string | null };

export type Endereco = {
  logradouro: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  pais?: string;
  codigo_municipio?: string | null;
  municipio_nome?: string | null;
  uf?: string | null;
  cep?: string | null;
  codigo_postal?: string | null;
  cidade?: string | null;
  estado_provincia?: string | null;
};

export type CertificadoResumo = {
  titular_uid: string;
  cadastrado: boolean;
  situacao: string | null;
  titular_nome: string | null;
  titular_documento_confere: boolean | null;
  valido_ate: string | null;
  ultima_verificacao_em: string | null;
  apto_para_emissao: boolean;
  motivo: string | null;
};

export type Autorizacao = {
  situacao: "vigente" | "revogada" | "expirada" | "futura" | "ausente" | "nao_aplicavel";
  tipo_documento: string | null;
  referencia: string | null;
  valido_de: string | null;
  valido_ate: string | null;
  registrada_por: string | null;
  registrada_em: string | null;
  revogada_em: string | null;
};

export type Prestador = {
  id: string;
  tipo: "propria" | "cliente";
  usuario_uid: string | null;
  documento: string;
  razao_social: string;
  nome_fantasia: string | null;
  inscricao_municipal: string | null;
  codigo_municipio: string;
  municipio_nome: string | null;
  uf: string | null;
  endereco: Endereco | null;
  telefone: string | null;
  email: string | null;
  optante_simples: string;
  regime_apuracao_sn: string | null;
  regime_especial: string;
  serie_dps: string;
  proximo_numero_dps: number;
  ambientes_habilitados: Ambiente[];
  informar_nome_endereco: boolean;
  ativo: boolean;
  autorizacao: Autorizacao | null;
  certificado: CertificadoResumo | null;
  pendencias: Pendencia[];
  apto_para_emissao: boolean;
};

export type Tomador = {
  id: string;
  prestador_id: string;
  tipo_pessoa: "PF" | "PJ" | "EXT";
  documento: string | null;
  nif: string | null;
  motivo_sem_nif: string | null;
  nome: string;
  inscricao_municipal: string | null;
  email: string | null;
  telefone: string | null;
  endereco: Endereco | null;
  usuario_uid: string | null;
};

export type TotalTributos = {
  modo: "nao_informar" | "percentual_sn" | "valores" | "percentuais";
  percentual_sn?: string | null;
  federal?: string | null;
  estadual?: string | null;
  municipal?: string | null;
};

export type ServicoNfse = {
  codigo_tributacao_nacional?: string | null;
  codigo_tributacao_municipal?: string | null;
  codigo_nbs?: string | null;
  descricao?: string | null;
  municipio_prestacao?: string | null;
  pais_prestacao?: string | null;
  codigo_interno?: string | null;
  referencia_contrato?: string | null;
};

export type ValoresNfse = {
  valor_servico?: string | null;
  valor_recebido?: string | null;
  desconto_incondicionado?: string | null;
  desconto_condicionado?: string | null;
  deducao_valor?: string | null;
  tributacao_issqn?: string | null;
  tipo_retencao_issqn?: string | null;
  aliquota_issqn?: string | null;
  tipo_imunidade?: string | null;
  pais_resultado?: string | null;
  retencao_cp?: string | null;
  retencao_irrf?: string | null;
  retencao_csll?: string | null;
  total_tributos?: TotalTributos | null;
};

export type NotaNfse = {
  id: string;
  provedor: string;
  fluxo: "propria" | "cliente" | null;
  tipo: string | null;
  status: StatusNfse;
  ambiente: Ambiente | null;
  cliente_id: string | null;
  conta_uid: string | null;
  prestador_id: string | null;
  tomador_id: string | null;
  intermediario_id: string | null;
  prestador: Record<string, unknown> | null;
  tomador: Record<string, unknown> | null;
  descricao_servico: string | null;
  valor: string | null;
  data_prestacao: string | null;
  data_competencia: string | null;
  competencia: string | null;
  servico: ServicoNfse | null;
  valores: ValoresNfse | null;
  calculo: Record<string, string | null> | null;
  dps: { id?: string; serie?: string; numero?: number; ambiente?: string; dh_emi?: string; hash_assinada?: string } | null;
  nfse: {
    chave_acesso?: string;
    chave_informada?: string;
    numero?: string;
    codigo_status?: string;
    data_processamento?: string;
    valor_liquido?: string;
    valor_issqn?: string;
    base_calculo?: string;
    xml_disponivel?: boolean;
    danfse_disponivel?: boolean;
  } | null;
  numero: string | null;
  rejeicoes: Mensagem[];
  alertas: Mensagem[];
  erro_mensagem: string | null;
  cancelamento: { situacao?: string; motivo?: string; codigo_motivo?: string; mensagens?: Mensagem[] } | null;
  substituicao: { nota_id?: string; chave_substituida?: string; codigo_motivo?: string; motivo?: string } | null;
  substituida_por: string | null;
  pendencias: Pendencia[];
  solicitado_por: string | null;
  transmitido_por: string | null;
  observacoes: string | null;
  criado_em: string | null;
  atualizado_em: string | null;
  versao: number;
};

export type Previa = {
  nota: NotaNfse;
  id_dps: string;
  xml: string;
  hash_previa: string;
  ambiente: Ambiente;
  producao: boolean;
  certificado: CertificadoResumo | null;
};

export type Indicadores = {
  total: number;
  por_status: Record<string, number>;
  autorizadas: number;
  rejeitadas: number;
  pendentes: number;
  desconhecidas: number;
  canceladas: number;
};

export type ConfiguracaoNfse = {
  habilitado: boolean;
  ambiente: Ambiente;
  producao_permitida: boolean;
  sefin_url: string;
  adn_url: string;
  assinatura_perfil: string;
  versao_leiaute: string;
  permissoes: string[];
  permissoes_disponiveis: Record<string, string>;
  opcoes: Record<string, Record<string, string>>;
  avisos: string[];
};

export type Tentativa = {
  id: string;
  operacao: string;
  resultado: string;
  correlacao: string | null;
  http_status: number | null;
  duracao_ms: number | null;
  erro_transporte: string | null;
  mensagens: Mensagem[];
  detalhe: string | null;
  operador_uid: string | null;
  ambiente: string | null;
  criado_em: string | null;
};

export type HistoricoNfse = {
  tentativas: Tentativa[];
  eventos: { id: string; tipo: string; situacao: string; motivo: string | null; codigo_motivo: string | null; operador_uid: string | null; criado_em: string | null }[];
  auditoria: { acao: string; ator_id: string | null; extra: Record<string, unknown> | null; request_id: string | null; criado_em: string | null }[];
};

export const STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  pronta: "Pronta para envio",
  processando: "Em processamento",
  autorizada: "Autorizada",
  rejeitada: "Rejeitada",
  falha_comunicacao: "Falha de comunicação",
  situacao_desconhecida: "Situação desconhecida",
  cancelada: "Cancelada",
  substituida: "Substituída",
  descartada: "Descartada",
  erro: "Erro (legado)",
};

export const AMBIENTE_LABEL: Record<string, string> = { homologacao: "Homologação", producao: "Produção" };

export const ETAPAS = [
  { chave: "operacao", titulo: "Operação" },
  { chave: "prestador", titulo: "Prestador" },
  { chave: "tomador", titulo: "Tomador" },
  { chave: "servico", titulo: "Serviço" },
  { chave: "valores", titulo: "Valores e tributos" },
  { chave: "revisao", titulo: "Revisão" },
] as const;

export const EDITAVEIS: StatusNfse[] = ["rascunho", "pronta", "rejeitada"];

/** "1.500,10" | "1500.10" → "1500.10" (string decimal com 2 casas) ou null. Sem float. */
export function normalizarValor(bruto: string | null | undefined): string | null {
  if (bruto === null || bruto === undefined) return null;
  let s = String(bruto).trim().replace(/\s/g, "").replace(/^R\$/, "");
  if (!s) return null;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const [int, dec = ""] = s.split(".");
  return `${BigInt(int).toString()}.${(dec + "00").slice(0, 2)}`;
}

/** Centavos inteiros (BigInt) a partir de "1500.10". */
export function centavos(v: string | null | undefined): bigint {
  const n = normalizarValor(v ?? null);
  if (!n) return BigInt(0);
  const [i, d] = n.split(".");
  return BigInt(i) * BigInt(100) + BigInt(d);
}

export function fmtCentavos(c: bigint): string {
  const neg = c < BigInt(0);
  const abs = neg ? -c : c;
  const reais = (abs / BigInt(100)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const cent = (abs % BigInt(100)).toString().padStart(2, "0");
  return `${neg ? "-" : ""}R$ ${reais},${cent}`;
}

/** Estimativa (igual à da API): base = serviço − desc. incond. − dedução; ISS = base × alíquota (half-up). */
export function estimar(v: ValoresNfse) {
  const vs = centavos(v.valor_servico);
  const di = centavos(v.desconto_incondicionado);
  const dc = centavos(v.desconto_condicionado);
  const ded = centavos(v.deducao_valor);
  let base = vs - di - ded;
  if (base < BigInt(0)) base = BigInt(0);
  const aliq = v.aliquota_issqn ? centavos(v.aliquota_issqn) : null; // 2,50% → 250
  const iss = aliq === null ? null : (base * aliq + BigInt(5000)) / BigInt(10000);
  const retido = iss !== null && (v.tipo_retencao_issqn === "2" || v.tipo_retencao_issqn === "3") ? iss : BigInt(0);
  const fed = centavos(v.retencao_cp) + centavos(v.retencao_irrf) + centavos(v.retencao_csll);
  return { base, iss, retido, fed, liquido: vs - di - dc - retido - fed };
}

// ------------------------------------------------------------------ Integração SEFIN (espelha app/schemas/nfse_integracao.py)
export type AmbienteInfo = {
  ambiente: Ambiente;
  rotulo: string;
  tp_amb: string;
  sefin_url: string;
  adn_url: string;
  disponivel: boolean;
  motivo_indisponivel: string | null;
};

export type AmbienteAtivo = {
  ambiente: Ambiente;
  rotulo: string;
  tp_amb: string;
  sefin_url: string;
  adn_url: string;
  origem: "configuracao_dinamica" | "variavel_de_ambiente";
  padrao_boot: Ambiente;
  producao_permitida: boolean;
  habilitado: boolean;
  versao: number;
  alterado_por: string | null;
  alterado_em: string | null;
  motivo: string | null;
  disponiveis: AmbienteInfo[];
  avisos: string[];
};

export type IndicadorStatus = "ok" | "falha" | "aviso" | "nao_executado";
export type Indicador = { chave: string; rotulo: string; status: IndicadorStatus; mensagem: string; detalhe: string | null };

export type CertificadoDados = {
  titular_nome: string | null;
  titular_documento: string | null;
  tipo: string | null;
  emissor_nome: string | null;
  numero_serie: string | null;
  valido_de: string | null;
  valido_ate: string | null;
  dias_para_vencer: number | null;
  usos: string[];
  icp_brasil: boolean | null;
  algoritmo_chave: string | null;
};

export type ValidacaoCertificado = {
  id: string;
  ambiente: Ambiente;
  sefin_url: string;
  prestador_id: string;
  prestador_documento: string;
  local_ok: boolean;
  comunicacao_ok: boolean | null;
  autenticacao_ok: boolean | null;
  conclusao: string;
  indicadores: Indicador[];
  certificado: CertificadoDados | null;
  executado_em: string;
  aviso: string;
};

export type ConsultaResultado = {
  id: string;
  operacao: "nfse" | "dps" | "evento";
  ambiente: Ambiente;
  resultado: "encontrada" | "nao_encontrada" | "sem_permissao" | "indisponivel" | "indeterminado";
  mensagem: string;
  http_status: number | null;
  chave_acesso: string | null;
  resumo: Record<string, string | null> | null;
  xml: string | null;
  nota_id: string | null;
  executado_em: string;
};

export type HistoricoIntegracaoItem = {
  id: string;
  origem: "diagnostico" | "tentativa";
  operacao: string;
  ambiente: string | null;
  resultado: string | null;
  http_status: number | null;
  duracao_ms: number | null;
  mensagem: string | null;
  operador_uid: string | null;
  correlacao: string | null;
  criado_em: string;
};

export type HistoricoIntegracao = { items: HistoricoIntegracaoItem[]; total: number; ambiente: string | null };
export type LimitesApi = { consultas_disponiveis: string[]; indisponiveis: string[] };

/** Tipos de evento do Swagger oficial (GET /nfse/{chave}/eventos/{tipoEvento}/{numSeqEvento}). */
export const TIPOS_EVENTO: Record<number, string> = {
  101101: "Cancelamento de NFS-e",
  101103: "Solicitação de análise fiscal para cancelamento",
  105102: "Cancelamento por substituição",
  105104: "Cancelamento deferido por análise fiscal",
  105105: "Cancelamento indeferido por análise fiscal",
  202201: "Manifestação do tomador — confirmação",
  202205: "Manifestação do tomador — rejeição",
  203202: "Manifestação do prestador — confirmação",
  203206: "Manifestação do prestador — rejeição",
  204203: "Manifestação do intermediário — confirmação",
  204207: "Manifestação do intermediário — rejeição",
  205204: "Anulação da rejeição",
  205208: "Anulação da rejeição (prestador/intermediário)",
  305101: "Cancelamento por ofício",
  305102: "Bloqueio por ofício",
  305103: "Desbloqueio por ofício",
  467201: "Evento tributário (467201)",
  907201: "Evento de sistema (907201)",
};
