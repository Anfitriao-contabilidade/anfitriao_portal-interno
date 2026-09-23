"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioEPapel } from "@/lib/admin";
import { anfitriaoComoPrestador, provider } from "@/lib/nfse";
import type { PessoaFiscal } from "@/lib/nfse";
import { resumoFinanceiroMes, fmtCompetencia, type Imovel, type Reserva, type Lancamento } from "@/lib/metrics";

/**
 * Dispara a emissão de uma NFS-e para um cliente já cadastrado. Só a equipe
 * (papel admin) pode chamar — checado aqui E pela policy de RLS
 * `notas_fiscais_write_admin` (dupla trava: mesmo que esse check falhe por
 * algum motivo, o insert no banco seria recusado do mesmo jeito).
 *
 * Fluxo: monta prestador/tomador conforme o tipo da nota → chama o provedor
 * (lib/nfse) → grava o resultado (autorizada de cara, ou "processando" para
 * consultar depois, ou "erro" com a mensagem) na tabela notas_fiscais.
 */
export async function emitirNota(formData: FormData) {
  const { user, isAdmin } = await getUsuarioEPapel();
  if (!user || !isAdmin) {
    return { ok: false, erro: "Apenas a equipe da Anfitrião pode emitir notas." };
  }

  const supabase = createClient();

  const clienteId = String(formData.get("cliente_id") || "");
  const imovelId = String(formData.get("imovel_id") || "") || null;
  const tipo = String(formData.get("tipo") || "hospede") as "hospede" | "proprietario" | "comissao";
  const descricaoServico = String(formData.get("descricao_servico") || "");
  const valorServico = Number(formData.get("valor") || 0);
  const competencia = String(formData.get("competencia") || "") || null;
  const codigoServico = String(formData.get("codigo_servico") || "") || undefined;
  const tomadorNome = String(formData.get("tomador_nome") || "");
  const tomadorDocumento = String(formData.get("tomador_documento") || "");

  if (!clienteId || !descricaoServico || !valorServico) {
    return { ok: false, erro: "Cliente, descrição do serviço e valor são obrigatórios." };
  }

  const { data: cliente } = await supabase
    .from("profiles")
    .select("id, nome, documento")
    .eq("id", clienteId)
    .single();

  if (!cliente || !cliente.documento) {
    return {
      ok: false,
      erro: "Cliente sem CNPJ/CPF cadastrado (campo 'documento' em Perfil) — preencha antes de emitir.",
    };
  }

  const referencia = `anf-${clienteId.slice(0, 8)}-${randomUUID().slice(0, 8)}`;

  // 'comissao': é o cliente Co-Anfitrião emitindo pela comissão de gestão
  // agregada de vários imóveis/proprietários num mês — o tomador não é uma
  // pessoa única, então NÃO chamamos o provedor de NFS-e automaticamente.
  // Fica só como rascunho para a equipe revisar e decidir manualmente como
  // (e se) emitir de fato — ver 0007_nota_comissao.sql.
  if (tipo === "comissao") {
    const { data: nota, error: erroInsert } = await supabase
      .from("notas_fiscais")
      .insert({
        owner_id: clienteId,
        imovel_id: imovelId,
        tipo,
        competencia,
        descricao_servico: descricaoServico,
        valor: valorServico,
        tomador_nome: null,
        tomador_documento: null,
        status: "rascunho",
        referencia,
        solicitado_por: user.id,
      })
      .select()
      .single();

    if (erroInsert || !nota) {
      return { ok: false, erro: erroInsert?.message || "Falha ao salvar o rascunho da nota." };
    }

    revalidatePath("/admin/notas");
    revalidatePath("/notas");
    return { ok: true, rascunho: true };
  }

  let prestador: PessoaFiscal;
  let tomador: PessoaFiscal;

  try {
    if (tipo === "proprietario") {
      // Anfitrião emite para o cliente (honorários de contabilidade/gestão).
      prestador = anfitriaoComoPrestador();
      tomador = { cpfCnpj: cliente.documento, razaoSocial: cliente.nome };
    } else {
      // O próprio cliente (CNPJ dele) emite para o hóspede.
      prestador = { cpfCnpj: cliente.documento, razaoSocial: cliente.nome };
      tomador = {
        cpfCnpj: tomadorDocumento || "",
        razaoSocial: tomadorNome || "Consumidor final",
      };
    }
  } catch (e) {
    return { ok: false, erro: (e as Error).message };
  }

  // Grava um rascunho antes de chamar o provedor — se a chamada cair pela
  // metade (timeout, queda de rede), fica registro do que foi tentado em vez
  // de simplesmente sumir.
  const { data: nota, error: erroInsert } = await supabase
    .from("notas_fiscais")
    .insert({
      owner_id: clienteId,
      imovel_id: imovelId,
      tipo,
      competencia,
      descricao_servico: descricaoServico,
      valor: valorServico,
      tomador_nome: tipo === "hospede" ? tomadorNome : null,
      tomador_documento: tipo === "hospede" ? tomadorDocumento : null,
      status: "rascunho",
      referencia,
      solicitado_por: user.id,
    })
    .select()
    .single();

  if (erroInsert || !nota) {
    return { ok: false, erro: erroInsert?.message || "Falha ao salvar o rascunho da nota." };
  }

  const resultado = await provider.emitir({
    referencia,
    prestador,
    tomador,
    descricaoServico,
    valorServico,
    codigoServico,
  });

  await supabase
    .from("notas_fiscais")
    .update({
      status: resultado.status,
      numero: resultado.numero,
      codigo_verificacao: resultado.codigoVerificacao,
      url_pdf: resultado.urlPdf,
      url_xml: resultado.urlXml,
      erro_mensagem: resultado.erroMensagem,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", nota.id);

  revalidatePath("/admin/notas");
  revalidatePath("/notas");

  return resultado.status === "erro"
    ? { ok: false, erro: resultado.erroMensagem || "Provedor recusou a emissão." }
    : { ok: true };
}

/**
 * Reconsulta uma nota que ficou "processando" (a autorização no Focus NFe é
 * assíncrona — a resposta do POST inicial só confirma que foi recebida, não
 * que já foi autorizada pela prefeitura).
 */
export async function reconsultarNota(formData: FormData) {
  const { isAdmin } = await getUsuarioEPapel();
  if (!isAdmin) return { ok: false, erro: "Apenas a equipe pode reconsultar." };

  const supabase = createClient();
  const notaId = String(formData.get("id") || "");
  const referencia = String(formData.get("referencia") || "");
  if (!notaId || !referencia) return { ok: false, erro: "Nota inválida." };

  const resultado = await provider.consultar(referencia);

  await supabase
    .from("notas_fiscais")
    .update({
      status: resultado.status,
      numero: resultado.numero,
      codigo_verificacao: resultado.codigoVerificacao,
      url_pdf: resultado.urlPdf,
      url_xml: resultado.urlXml,
      erro_mensagem: resultado.erroMensagem,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", notaId);

  revalidatePath("/admin/notas");
  revalidatePath("/notas");
  return { ok: true };
}

/**
 * Calcula o valor de referência da comissão de gestão de um cliente
 * Co-Anfitrião numa competência — o mesmo número que o próprio cliente já vê
 * no Portal (Financeiro) e que a equipe vê no "Split de comissão" do Painel
 * Interno. Usada pelo EmitirNotaForm para pré-preencher o rascunho de nota
 * tipo 'comissao' com um clique, em vez da equipe ter que calcular/digitar
 * o valor manualmente — é a integração Financeiro ↔ Notas Fiscais pedida
 * para o Portal do Cliente, do lado da equipe (a equipe é quem tem
 * permissão de escrita em notas_fiscais).
 */
export async function buscarComissaoReferencia(clienteId: string, competencia: string) {
  const { isAdmin } = await getUsuarioEPapel();
  if (!isAdmin) return { ok: false as const, erro: "Apenas a equipe pode consultar este valor." };
  if (!clienteId || !competencia) return { ok: false as const, erro: "Cliente e competência são obrigatórios." };

  const supabase = createClient();

  const [{ data: imoveisRaw }, { data: cliente }] = await Promise.all([
    supabase.from("imoveis").select("id, nome, taxa_gestao_pct").eq("owner_id", clienteId),
    supabase.from("profiles").select("nome").eq("id", clienteId).single(),
  ]);

  const imoveisTyped = (imoveisRaw || []) as Imovel[];
  const imovelIds = imoveisTyped.map((i) => i.id);

  const [{ data: reservas }, { data: lancamentos }] = await Promise.all([
    imovelIds.length
      ? supabase.from("reservas").select("imovel_id, checkin, checkout, valor_bruto").in("imovel_id", imovelIds)
      : Promise.resolve({ data: [] as Reserva[] }),
    supabase.from("lancamentos").select("imovel_id, tipo, valor, data").eq("owner_id", clienteId),
  ]);

  const resumo = resumoFinanceiroMes(
    imoveisTyped,
    (reservas || []) as Reserva[],
    (lancamentos || []) as Lancamento[],
    competencia
  );

  return {
    ok: true as const,
    valor: resumo.comissaoGestao,
    descricao: `Comissão de gestão (Co-Anfitrião) — ${cliente?.nome ? cliente.nome + " — " : ""}${fmtCompetencia(competencia)}`,
  };
}
