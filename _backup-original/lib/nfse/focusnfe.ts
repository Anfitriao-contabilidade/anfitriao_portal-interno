import type { EmitirNfseInput, EmitirNfseResultado, NfseProvider, NfseStatus } from "./types";

/**
 * Adapter para a API REST do Focus NFe (https://doc.focusnfe.com.br/).
 *
 * Formato do endpoint, autenticação e nomes de campo abaixo foram conferidos
 * na documentação oficial do Focus NFe (não é um palpite) — mas **nunca foi
 * testado contra a API de verdade**: este ambiente não tem como chamar uma
 * API externa real para validar (mesma limitação de rede já documentada no
 * resto deste projeto). Antes de emitir em produção:
 *
 *   1. Criar conta no Focus NFe e pegar um token de HOMOLOGAÇÃO.
 *   2. Cadastrar a empresa (prestador) no painel do Focus NFe — é lá que se
 *      envia o certificado digital A1 do cliente.
 *   3. Emitir 2–3 notas de teste em homologação e comparar o retorno com o
 *      que este arquivo espera (`mapStatus`, campos de erro) — cada
 *      prefeitura tem particularidades (código de serviço, alíquota,
 *      campos obrigatórios) que só aparecem testando de verdade.
 *   4. Só então trocar FOCUSNFE_BASE_URL para produção (ver .env.example).
 *
 * Documentação consultada em 2026-09-12:
 * - Autenticação: https://doc.focusnfe.com.br/reference/autenticacao
 * - Emitir NFS-e: https://doc.focusnfe.com.br/reference/emitir_nfse
 * - Consultar NFS-e: https://doc.focusnfe.com.br/reference/consultar_nfse
 * - Ambientes (URLs): https://doc.focusnfe.com.br/reference/ambiente
 */

const BASE_URL = process.env.FOCUSNFE_BASE_URL || "https://homologacao.focusnfe.com.br";
const TOKEN = process.env.FOCUSNFE_TOKEN;

function authHeader(): string {
  if (!TOKEN) {
    throw new Error(
      "FOCUSNFE_TOKEN não configurado (.env.local) — gere o token no painel do Focus NFe " +
        "(cadastro da empresa) antes de tentar emitir uma nota."
    );
  }
  // Basic Auth: token como usuário, senha em branco (Basic base64("token:")).
  return "Basic " + Buffer.from(`${TOKEN}:`).toString("base64");
}

/** Mapeia o "status" que a API do Focus NFe devolve para o enum usado no nosso banco. */
function mapStatus(focusStatus: string | undefined): NfseStatus {
  switch (focusStatus) {
    case "autorizado":
      return "autorizada";
    case "cancelado":
      return "cancelada";
    case "erro_autorizacao":
    case "erro":
      return "erro";
    case "processando_autorizacao":
    case "processing":
    default:
      return "processando";
  }
}

function toFocusPessoa(p: EmitirNfseInput["prestador"]) {
  return {
    cpf_cnpj: p.cpfCnpj,
    inscricao_municipal: p.inscricaoMunicipal,
    razao_social: p.razaoSocial,
    email: p.email,
    ...(p.endereco
      ? {
          endereco: {
            logradouro: p.endereco.logradouro,
            numero: p.endereco.numero,
            bairro: p.endereco.bairro,
            codigo_municipio: p.endereco.codigoMunicipio,
            uf: p.endereco.uf,
            cep: p.endereco.cep,
          },
        }
      : {}),
  };
}

export const focusNfe: NfseProvider = {
  nome: "Focus NFe",

  async emitir(input: EmitirNfseInput): Promise<EmitirNfseResultado> {
    const url = `${BASE_URL}/v2/nfse?ref=${encodeURIComponent(input.referencia)}`;

    const body = {
      data_emissao: new Date().toISOString(),
      // 1 = "Tributação no município" — o valor mais comum para hospedagem/
      // serviços prestados no próprio município do prestador. Ajustar se o
      // caso de uso exigir outro (ex.: serviço prestado fora do município).
      natureza_operacao: "1",
      optante_simples_nacional: true,
      incentivador_cultural: false,
      prestador: toFocusPessoa(input.prestador),
      tomador: toFocusPessoa(input.tomador),
      servico: {
        descricao: input.descricaoServico,
        valor: input.valorServico,
        item_lista_servico: input.codigoServico, // LC 116/2003 — confirmar por município
        aliquota: input.aliquotaIss,
        iss_retido: input.issRetido ?? false,
      },
    };

    let resp: Response;
    try {
      resp = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: authHeader(),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });
    } catch (e) {
      return {
        status: "erro",
        referencia: input.referencia,
        erroMensagem: `Falha de rede ao chamar o Focus NFe: ${(e as Error).message}`,
      };
    }

    const json = await resp.json().catch(() => ({}));

    if (!resp.ok || json?.erro) {
      return {
        status: "erro",
        referencia: input.referencia,
        erroMensagem: json?.mensagem || json?.erros?.[0]?.mensagem || `Erro HTTP ${resp.status} do Focus NFe.`,
      };
    }

    return {
      status: mapStatus(json.status),
      referencia: input.referencia,
      numero: json.numero,
      codigoVerificacao: json.codigo_verificacao,
      urlPdf: json.url_pdf,
    };
  },

  async consultar(referencia: string): Promise<EmitirNfseResultado> {
    const url = `${BASE_URL}/v2/nfse/${encodeURIComponent(referencia)}`;

    let resp: Response;
    try {
      resp = await fetch(url, {
        method: "GET",
        headers: { Authorization: authHeader(), Accept: "application/json" },
        cache: "no-store",
      });
    } catch (e) {
      return {
        status: "erro",
        referencia,
        erroMensagem: `Falha de rede ao consultar o Focus NFe: ${(e as Error).message}`,
      };
    }

    if (resp.status === 404) {
      return { status: "erro", referencia, erroMensagem: "Referência não encontrada no Focus NFe." };
    }

    const json = await resp.json().catch(() => ({}));

    return {
      status: mapStatus(json.status),
      referencia,
      numero: json.numero,
      codigoVerificacao: json.codigo_verificacao,
      urlPdf: json.url_danfse || json.url_pdf,
      urlXml: json.caminho_xml_nota_fiscal,
      erroMensagem: json.status === "erro_autorizacao" ? json.mensagem : undefined,
    };
  },
};
