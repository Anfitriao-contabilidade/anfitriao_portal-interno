"use server";

import { revalidatePath } from "next/cache";
import { getSessaoAdmin } from "@/lib/auth";
import { api, num } from "@/lib/api";
import { apiFail, fail, formToObject, invalid, ok, type ActionState } from "@/lib/actions";
import { competenciaSchema, notaSchema, objectId, uid } from "@/lib/validation";
import type { NotaFiscal } from "@/lib/tipos";

const NAO_AUTORIZADO = "Apenas a equipe da Anfitrião pode emitir notas.";

function revalidar() {
  revalidatePath("/admin/notas");
  revalidatePath("/notas");
}

/**
 * Emissão de NFS-e. Toda a lógica (prestador/tomador, rascunho antes de chamar
 * o provedor, Focus NFe, auditoria) está na API — o token do Focus NFe não
 * fica mais no portal.
 */
export async function emitirNota(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await getSessaoAdmin();
  if (!admin) return fail(NAO_AUTORIZADO);

  const parsed = notaSchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const d = parsed.data;
  if (d.tipo === "comissao" && !d.competencia) {
    return fail("Informe a competência da nota de comissão.", { competencia: "Obrigatório para nota de comissão" });
  }

  let nota: NotaFiscal;
  try {
    nota = await api<NotaFiscal>("/notas-fiscais", {
      method: "POST",
      body: {
        cliente_id: d.cliente_id,
        imovel_id: d.imovel_id ?? null,
        tipo: d.tipo,
        competencia: d.competencia ?? null,
        descricao_servico: d.descricao_servico,
        valor: d.valor.toFixed(2),
        codigo_servico: d.tipo === "comissao" ? null : d.codigo_servico ?? null,
        tomador_nome: d.tipo === "hospede" ? d.tomador_nome ?? null : null,
        tomador_documento: d.tipo === "hospede" ? d.tomador_documento ?? null : null,
      },
    });
  } catch (e) {
    return apiFail("nota:emitir", e);
  }

  revalidar();
  if (nota.status === "rascunho") return ok("Rascunho salvo — revise e decida manualmente como emitir.");
  if (nota.status === "erro") return fail(`O provedor recusou a emissão: ${nota.erro_mensagem ?? "erro desconhecido"}`);
  return ok("Nota enviada ao provedor — acompanhe o status na lista.");
}

/** Reconsulta uma nota "processando" (a referência fica na API, nunca vem do formulário). */
export async function reconsultarNota(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await getSessaoAdmin();
  if (!admin) return fail(NAO_AUTORIZADO);
  const id = objectId.safeParse(formData.get("id"));
  if (!id.success) return fail("Nota inválida.");

  try {
    await api(`/notas-fiscais/${id.data}/reconsultar`, { method: "POST" });
  } catch (e) {
    return apiFail("nota:reconsulta", e);
  }
  revalidar();
  return ok("Status atualizado.");
}

/** Valor de referência da comissão de gestão (mesmo número do Financeiro do cliente). */
export async function buscarComissaoReferencia(clienteId: string, competencia: string) {
  const admin = await getSessaoAdmin();
  if (!admin) return { ok: false as const, erro: "Apenas a equipe pode consultar este valor." };
  const idOk = uid.safeParse(clienteId);
  const compOk = competenciaSchema.safeParse(competencia);
  if (!idOk.success || !compOk.success) return { ok: false as const, erro: "Selecione o cliente e informe a competência (AAAA-MM)." };

  try {
    const r = await api<{ valor: string; descricao: string }>("/notas-fiscais/comissao-referencia", {
      query: { cliente_id: idOk.data, competencia: compOk.data },
    });
    return { ok: true as const, valor: num(r.valor), descricao: r.descricao };
  } catch (e) {
    console.error("[nota:comissao-ref]", e);
    return { ok: false as const, erro: "Não foi possível calcular o valor agora." };
  }
}
