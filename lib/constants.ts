/** Listas de domínio compartilhadas entre servidor (validação) e formulários (cliente). */
export const TIPOS_PESSOA = ["PF", "PJ"] as const;
export const STATUS_FISCAL = ["regular", "em_verificacao", "pendencia"] as const;
export const PERFIS_ATUACAO = ["proprietario", "coanfitriao", "ambos"] as const;
export const TIPOS_IMOVEL = ["Apartamento", "Studio/Flat", "Casa", "Outro"] as const;
export const CONDICOES_IMOVEL = ["Novo", "Semi-novo", "Usado"] as const;
export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;
export const TIPOS_NOTA = ["hospede", "proprietario", "comissao"] as const;
