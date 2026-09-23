/**
 * Tipos usados pela integração de emissão de NFS-e (nota fiscal de serviço
 * eletrônica). Desenhado para caber qualquer provedor de API fiscal
 * (Focus NFe, PlugNotas, eNotas, Nuvem Fiscal, TecnoSpeed, Notaas) atrás da
 * mesma interface — ver README ("Emissão de NFS-e") para como trocar de
 * provedor.
 */

export type PessoaFiscal = {
  /** CPF (11 dígitos) ou CNPJ (14 dígitos), só números. */
  cpfCnpj: string;
  razaoSocial: string;
  /** Obrigatório para o PRESTADOR; normalmente não se aplica ao tomador. */
  inscricaoMunicipal?: string;
  email?: string;
  endereco?: {
    logradouro?: string;
    numero?: string;
    bairro?: string;
    codigoMunicipio?: string; // código IBGE do município
    uf?: string;
    cep?: string;
  };
};

export type EmitirNfseInput = {
  /** Identificador único que nós geramos (referencia da nota no nosso banco). */
  referencia: string;
  prestador: PessoaFiscal;
  tomador: PessoaFiscal;
  descricaoServico: string;
  valorServico: number;
  /**
   * Código do serviço conforme a Lista de Serviços da LC 116/2003 (ex.:
   * "14.01"). Varia por prefeitura e por natureza do serviço prestado —
   * confirmar o código correto de cada município antes de emitir em
   * produção (o provedor normalmente valida e rejeita um código incompatível
   * com o cadastro da prefeitura).
   */
  codigoServico?: string;
  aliquotaIss?: number;
  issRetido?: boolean;
};

export type NfseStatus = "processando" | "autorizada" | "erro" | "cancelada";

export type EmitirNfseResultado = {
  status: NfseStatus;
  referencia: string;
  numero?: string;
  codigoVerificacao?: string;
  urlPdf?: string;
  urlXml?: string;
  /** Preenchido só quando status === 'erro'. */
  erroMensagem?: string;
};

/**
 * Interface que qualquer adapter de provedor deve implementar. Trocar de
 * provedor (ex.: sair do Focus NFe para o Notaas) é escrever um novo arquivo
 * em lib/nfse/ que implemente essa mesma interface — nenhum outro lugar do
 * app (server actions, telas) muda.
 */
export interface NfseProvider {
  nome: string;
  emitir(input: EmitirNfseInput): Promise<EmitirNfseResultado>;
  consultar(referencia: string): Promise<EmitirNfseResultado>;
}
