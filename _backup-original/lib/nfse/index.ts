import { focusNfe } from "./focusnfe";
import type { NfseProvider, PessoaFiscal } from "./types";

export * from "./types";

/**
 * Provedor ativo. Trocar de provedor é: (1) escrever um novo arquivo em
 * lib/nfse/ implementando NfseProvider (mesmo molde de focusnfe.ts) e
 * (2) apontar esse `provider` para ele — nenhum outro lugar do app muda,
 * porque server actions e telas só conhecem a interface `NfseProvider`.
 */
export const provider: NfseProvider = focusNfe;

/**
 * Dados fixos da própria Anfitrião como prestadora, usados quando tipo da
 * nota = 'proprietario' (nota de honorários cobrada do cliente). Preencher
 * no .env.local — ver .env.example.
 */
export function anfitriaoComoPrestador(): PessoaFiscal {
  const cnpj = process.env.ANFITRIAO_CNPJ;
  const razaoSocial = process.env.ANFITRIAO_RAZAO_SOCIAL;
  const inscricaoMunicipal = process.env.ANFITRIAO_INSCRICAO_MUNICIPAL;
  if (!cnpj || !razaoSocial) {
    throw new Error(
      "ANFITRIAO_CNPJ / ANFITRIAO_RAZAO_SOCIAL não configurados (.env.local) — " +
        "necessários para emitir notas do tipo 'proprietario' (honorários)."
    );
  }
  return { cpfCnpj: cnpj, razaoSocial, inscricaoMunicipal };
}
