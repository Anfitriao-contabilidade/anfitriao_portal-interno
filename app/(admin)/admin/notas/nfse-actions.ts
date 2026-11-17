"use server";

/**
 * Server Actions da NFS-e Nacional. Tudo passa pela Anfitrião API (/nfse): o Portal nunca fala
 * com a Sefin, não vê certificado e não decide regra fiscal — só repassa o que o operador digitou.
 * Os identificadores (nota, prestador, tomador) são validados aqui e de novo na API.
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessaoAdmin } from "@/lib/auth";
import { api, ApiError, type Pagina } from "@/lib/api";
import { apiFail, fail, formToObject, ok, type ActionState } from "@/lib/actions";
import type { NotaNfse, Prestador, Previa, Tomador } from "@/lib/nfse";
import { objectId } from "@/lib/validation";

export type Resultado<T> = { ok: true; dados: T } | { ok: false; erro: string; campos?: Record<string, string>; codigo?: string };

const SO_EQUIPE = "Apenas a equipe da Anfitrião pode operar notas fiscais.";

function erro(e: unknown, contexto: string): { ok: false; erro: string; campos?: Record<string, string>; codigo?: string } {
  if (e instanceof ApiError) {
    if (e.status === 422 && e.code === "validacao") {
      const campos: Record<string, string> = {};
      for (const d of e.details ?? []) {
        const loc = (d.loc ?? []).filter((x) => x !== "body").join(".");
        if (loc && !campos[loc]) campos[loc] = String(d.msg ?? "Valor inválido").replace(/^Value error, /, "");
      }
      return { ok: false, erro: "Revise os campos destacados.", campos, codigo: e.code };
    }
    if (e.status < 500 || e.status === 503) return { ok: false, erro: e.message, codigo: e.code };
    console.error(`[nfse:${contexto}]`, e.status, e.code, e.requestId);
    return { ok: false, erro: `Não foi possível concluir agora.${e.requestId ? ` (código ${e.requestId.slice(0, 8)})` : ""}` };
  }
  console.error(`[nfse:${contexto}]`, e);
  return { ok: false, erro: "Não foi possível concluir agora." };
}

function revalidar(id?: string) {
  revalidatePath("/admin/notas");
  if (id) revalidatePath(`/admin/notas/${id}`);
  revalidatePath("/notas");
}

async function exigirAdmin() {
  return (await getSessaoAdmin()) !== null;
}

// ------------------------------------------------------------------ rascunho / assistente
const rascunhoSchema = z
  .object({
    prestador_id: objectId.optional(),
    tomador_id: objectId.nullable().optional(),
    intermediario_id: objectId.nullable().optional(),
    data_prestacao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    data_competencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    servico: z.record(z.string(), z.unknown()).nullable().optional(),
    valores: z.record(z.string(), z.unknown()).nullable().optional(),
    observacoes: z.string().max(1000).nullable().optional(),
    chave_idempotencia: z.string().regex(/^[A-Za-z0-9-]{16,64}$/).optional(),
  })
  .strict();

/** Remove strings vazias (o rascunho salva só o que foi preenchido). */
function limpar<T>(v: T): T {
  if (Array.isArray(v)) return v.map(limpar) as T;
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      const y = limpar(x);
      out[k] = y === "" ? null : y;
    }
    return out as T;
  }
  return v;
}

export async function salvarRascunhoNfse(id: string | null, dados: unknown): Promise<Resultado<NotaNfse>> {
  if (!(await exigirAdmin())) return { ok: false, erro: SO_EQUIPE };
  const parsed = rascunhoSchema.safeParse(limpar(dados));
  if (!parsed.success) return { ok: false, erro: "Dados inválidos no formulário." };
  try {
    let nota: NotaNfse;
    if (id) {
      if (!objectId.safeParse(id).success) return { ok: false, erro: "Nota inválida." };
      const { chave_idempotencia: _ignorada, ...resto } = parsed.data;
      void _ignorada;
      nota = await api<NotaNfse>(`/nfse/notas/${id}`, { method: "PATCH", body: resto });
    } else {
      if (!parsed.data.prestador_id) return { ok: false, erro: "Selecione o prestador.", campos: { prestador_id: "Obrigatório" } };
      nota = await api<NotaNfse>("/nfse/notas", { method: "POST", body: parsed.data });
    }
    revalidar(nota.id);
    return { ok: true, dados: nota };
  } catch (e) {
    return erro(e, "rascunho");
  }
}

export async function prepararNfse(id: string): Promise<Resultado<Previa>> {
  if (!(await exigirAdmin())) return { ok: false, erro: SO_EQUIPE };
  if (!objectId.safeParse(id).success) return { ok: false, erro: "Nota inválida." };
  try {
    const previa = await api<Previa>(`/nfse/notas/${id}/preparar`, { method: "POST" });
    revalidar(id);
    return { ok: true, dados: previa };
  } catch (e) {
    return erro(e, "preparar");
  }
}

export async function transmitirNfse(id: string, hashPrevia: string, confirmarProducao: boolean): Promise<Resultado<NotaNfse>> {
  if (!(await exigirAdmin())) return { ok: false, erro: SO_EQUIPE };
  if (!objectId.safeParse(id).success || !/^[0-9a-f]{64}$/.test(hashPrevia)) return { ok: false, erro: "Dados inválidos." };
  try {
    const nota = await api<NotaNfse>(`/nfse/notas/${id}/transmitir`, {
      method: "POST",
      body: { confirmar: true, confirmar_producao: confirmarProducao, hash_previa: hashPrevia },
    });
    revalidar(id);
    return { ok: true, dados: nota };
  } catch (e) {
    return erro(e, "transmitir");
  }
}

export async function listarTomadoresNfse(prestadorId: string, busca = ""): Promise<Resultado<Tomador[]>> {
  if (!(await exigirAdmin())) return { ok: false, erro: SO_EQUIPE };
  if (!objectId.safeParse(prestadorId).success) return { ok: false, erro: "Prestador inválido." };
  try {
    const p = await api<Pagina<Tomador>>(`/nfse/prestadores/${prestadorId}/tomadores`, {
      query: { busca: busca.slice(0, 60) || undefined, limit: 100 },
    });
    return { ok: true, dados: p.items };
  } catch (e) {
    return erro(e, "tomadores");
  }
}

export async function criarTomadorNfse(prestadorId: string, dados: unknown): Promise<Resultado<Tomador>> {
  if (!(await exigirAdmin())) return { ok: false, erro: SO_EQUIPE };
  if (!objectId.safeParse(prestadorId).success) return { ok: false, erro: "Prestador inválido." };
  try {
    const t = await api<Tomador>(`/nfse/prestadores/${prestadorId}/tomadores`, { method: "POST", body: limpar(dados) });
    return { ok: true, dados: t };
  } catch (e) {
    return erro(e, "tomador:criar");
  }
}

// ------------------------------------------------------------------ ações da nota (formulários)
const idForm = z.object({ id: objectId });

export async function consultarNfse(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await exigirAdmin())) return fail(SO_EQUIPE);
  const p = idForm.safeParse({ id: formData.get("id") });
  if (!p.success) return fail("Nota inválida.");
  try {
    const n = await api<NotaNfse>(`/nfse/notas/${p.data.id}/consultar`, { method: "POST" });
    revalidar(p.data.id);
    return ok(`Situação atualizada: ${n.status.replace(/_/g, " ")}.`);
  } catch (e) {
    return apiFail("nfse:consultar", e);
  }
}

const cancelarSchema = z.object({
  id: objectId,
  codigo_motivo: z.enum(["1", "2", "9"]),
  motivo: z.string().trim().min(15, "Mínimo de 15 caracteres").max(255),
  confirmar: z.literal("on", { message: "Confirme o cancelamento" }),
  confirmar_producao: z.string().optional(),
});

export async function cancelarNfse(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await exigirAdmin())) return fail(SO_EQUIPE);
  const p = cancelarSchema.safeParse(formToObject(formData));
  if (!p.success) {
    const campos: Record<string, string> = {};
    for (const i of p.error.issues) campos[String(i.path[0])] = i.message;
    return fail("Revise os campos destacados.", campos);
  }
  try {
    const n = await api<NotaNfse>(`/nfse/notas/${p.data.id}/cancelar`, {
      method: "POST",
      body: {
        codigo_motivo: p.data.codigo_motivo,
        motivo: p.data.motivo,
        confirmar: true,
        confirmar_producao: p.data.confirmar_producao === "on",
      },
    });
    revalidar(p.data.id);
    if (n.status === "cancelada") return ok("Cancelamento registrado no Sistema Nacional.");
    return fail(
      n.cancelamento?.situacao === "nao_enviado"
        ? "O pedido não chegou à Sefin. Tente novamente."
        : "Pedido enviado, mas sem confirmação. Use \"Consultar situação\" para confirmar."
    );
  } catch (e) {
    return apiFail("nfse:cancelar", e);
  }
}

const substituirSchema = z.object({
  id: objectId,
  codigo_motivo: z.enum(["01", "02", "03", "04", "05", "99"]),
  motivo: z.string().trim().max(255).optional(),
});

export async function substituirNfse(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await exigirAdmin())) return fail(SO_EQUIPE);
  const p = substituirSchema.safeParse(formToObject(formData));
  if (!p.success) return fail("Revise o motivo da substituição.");
  if (p.data.motivo && p.data.motivo.length < 15) return fail("A descrição do motivo precisa de ao menos 15 caracteres.", { motivo: "Mínimo 15" });
  let nova: NotaNfse;
  try {
    nova = await api<NotaNfse>(`/nfse/notas/${p.data.id}/substituir`, {
      method: "POST",
      body: { codigo_motivo: p.data.codigo_motivo, motivo: p.data.motivo || null },
    });
  } catch (e) {
    return apiFail("nfse:substituir", e);
  }
  revalidar(p.data.id);
  return { ...ok("Rascunho substituto criado. Revise e transmita."), resultado: { id: nova.id } };
}

export async function descartarNfse(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await exigirAdmin())) return fail(SO_EQUIPE);
  const p = idForm.safeParse({ id: formData.get("id") });
  if (!p.success) return fail("Nota inválida.");
  try {
    await api(`/nfse/notas/${p.data.id}/descartar`, { method: "POST" });
  } catch (e) {
    return apiFail("nfse:descartar", e);
  }
  revalidar(p.data.id);
  return ok("Rascunho descartado.");
}

// ------------------------------------------------------------------ prestadores
const opcional = (s: z.ZodTypeAny) => z.preprocess((v) => (v === "" || v === null ? undefined : v), s.optional());
const dig = (v: unknown) => (typeof v === "string" ? v.replace(/\D/g, "") : v);

const prestadorSchema = z.object({
  razao_social: z.string().trim().min(1).max(300),
  nome_fantasia: opcional(z.string().trim().max(150)),
  inscricao_municipal: opcional(z.string().trim().max(15)),
  codigo_municipio: z.preprocess(dig, z.string().regex(/^\d{7}$/, "IBGE com 7 dígitos")),
  municipio_nome: opcional(z.string().trim().max(150)),
  uf: opcional(z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, "UF inválida")),
  telefone: opcional(z.preprocess(dig, z.string().regex(/^\d{6,20}$/, "6 a 20 dígitos"))),
  email: opcional(z.string().trim().email("E-mail inválido").max(80)),
  optante_simples: z.enum(["1", "2", "3"]),
  regime_apuracao_sn: opcional(z.enum(["1", "2", "3"])),
  regime_especial: z.enum(["0", "1", "2", "3", "4", "5", "6", "9"]),
  serie_dps: z.string().regex(/^\d{1,5}$/, "1 a 5 dígitos"),
  proximo_numero_dps: opcional(z.coerce.number().int().min(1)),
  logradouro: opcional(z.string().trim().max(255)),
  numero: opcional(z.string().trim().max(60)),
  complemento: opcional(z.string().trim().max(156)),
  bairro: opcional(z.string().trim().max(60)),
  cep: opcional(z.preprocess(dig, z.string().regex(/^\d{8}$/, "CEP com 8 dígitos"))),
});

function corpoPrestador(d: z.infer<typeof prestadorSchema>, formData: FormData) {
  const { logradouro, numero, complemento, bairro, cep, ...resto } = d;
  const endereco =
    logradouro && numero && bairro
      ? { logradouro, numero, complemento: complemento ?? null, bairro, cep: cep ?? null, codigo_municipio: d.codigo_municipio, uf: d.uf ?? null, pais: "BR" }
      : null;
  const ambientes = ["homologacao", ...(formData.get("producao") === "on" ? ["producao"] : [])];
  return {
    ...resto,
    endereco,
    ambientes_habilitados: ambientes,
    informar_nome_endereco: formData.get("informar_nome_endereco") === "on",
    regime_apuracao_sn: d.optante_simples === "3" ? d.regime_apuracao_sn ?? null : null,
  };
}

function camposZod(error: z.ZodError) {
  const c: Record<string, string> = {};
  for (const i of error.issues) c[String(i.path[0])] ??= i.message;
  return c;
}

export async function criarPrestador(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await exigirAdmin())) return fail(SO_EQUIPE);
  const obj = formToObject(formData);
  const base = prestadorSchema.safeParse(obj);
  const tipo = obj.tipo === "propria" ? "propria" : "cliente";
  const documento = (obj.documento ?? "").replace(/\D/g, "");
  if (!base.success) return fail("Revise os campos destacados.", camposZod(base.error));
  if (tipo === "cliente" && !/^[A-Za-z0-9_-]{1,128}$/.test(obj.usuario_uid ?? "")) {
    return fail("Selecione o cliente da plataforma.", { usuario_uid: "Obrigatório" });
  }
  let criado: Prestador;
  try {
    criado = await api<Prestador>("/nfse/prestadores", {
      method: "POST",
      body: { ...corpoPrestador(base.data, formData), tipo, documento, usuario_uid: tipo === "cliente" ? obj.usuario_uid : null },
    });
  } catch (e) {
    return apiFail("nfse:prestador:criar", e);
  }
  revalidatePath("/admin/notas/prestadores");
  return { ...ok("Prestador cadastrado."), resultado: { id: criado.id } };
}

export async function atualizarPrestador(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await exigirAdmin())) return fail(SO_EQUIPE);
  const id = objectId.safeParse(formData.get("id"));
  if (!id.success) return fail("Prestador inválido.");
  const obj = formToObject(formData);
  const base = prestadorSchema.safeParse(obj);
  if (!base.success) return fail("Revise os campos destacados.", camposZod(base.error));
  try {
    await api(`/nfse/prestadores/${id.data}`, {
      method: "PATCH",
      body: { ...corpoPrestador(base.data, formData), ativo: formData.get("ativo") === "on" },
    });
  } catch (e) {
    return apiFail("nfse:prestador:atualizar", e);
  }
  revalidatePath("/admin/notas/prestadores");
  revalidatePath(`/admin/notas/prestadores/${id.data}`);
  return ok("Prestador atualizado.");
}

const autorizacaoSchema = z.object({
  id: objectId,
  tipo_documento: z.enum(["contrato_prestacao_servicos", "procuracao", "termo_autorizacao"]),
  referencia: z.string().trim().min(3, "Informe a referência do documento").max(200),
  valido_de: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  valido_ate: opcional(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida")),
  observacao: opcional(z.string().trim().max(500)),
  confirmar: z.literal("on", { message: "Confirme que o documento foi conferido" }),
});

export async function registrarAutorizacao(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await exigirAdmin())) return fail(SO_EQUIPE);
  const p = autorizacaoSchema.safeParse(formToObject(formData));
  if (!p.success) return fail("Revise os campos destacados.", camposZod(p.error));
  const { id, ...corpo } = p.data;
  try {
    await api(`/nfse/prestadores/${id}/autorizacao`, { method: "POST", body: { ...corpo, confirmar: true } });
  } catch (e) {
    return apiFail("nfse:autorizacao", e);
  }
  revalidatePath(`/admin/notas/prestadores/${id}`);
  return ok("Autorização registrada.");
}

export async function revogarAutorizacao(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await exigirAdmin())) return fail(SO_EQUIPE);
  const id = objectId.safeParse(formData.get("id"));
  if (!id.success) return fail("Prestador inválido.");
  try {
    await api(`/nfse/prestadores/${id.data}/autorizacao`, { method: "DELETE" });
  } catch (e) {
    return apiFail("nfse:autorizacao:revogar", e);
  }
  revalidatePath(`/admin/notas/prestadores/${id.data}`);
  return ok("Autorização revogada. Novas emissões em nome deste cliente ficam bloqueadas.");
}

export async function consultarConvenio(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await exigirAdmin())) return fail(SO_EQUIPE);
  const id = objectId.safeParse(formData.get("id"));
  if (!id.success) return fail("Prestador inválido.");
  try {
    const r = await api<{ resultado: string; dados: Record<string, unknown> | null; detalhe: string | null }>(
      `/nfse/prestadores/${id.data}/convenio`
    );
    if (r.resultado === "encontrada") {
      return { ...ok("Parâmetros do município obtidos (informativo)."), resultado: { dados: r.dados ?? {} } };
    }
    return fail(r.resultado === "nao_encontrada" ? "Município sem parâmetros no Sistema Nacional." : r.detalhe ?? "Consulta inconclusiva.");
  } catch (e) {
    return apiFail("nfse:convenio", e);
  }
}


// ------------------------------------------------------------------ e-mail da NFS-e
const emailSchema = z.object({
  id: objectId,
  destinatarios: z
    .string()
    .trim()
    .max(400)
    .transform((v) => v.split(/[,;\s]+/).filter(Boolean))
    .pipe(z.array(z.string().email("E-mail inválido")).max(5, "No máximo 5 destinatários")),
  mensagem: z.string().trim().max(1000, "Máximo de 1000 caracteres").optional(),
});

/** Envia DANFSe oficial + XML ao(s) destinatário(s). Vazio = e-mail cadastrado do tomador (a API decide). */
export async function enviarEmailNfse(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await exigirAdmin())) return fail(SO_EQUIPE);
  const p = emailSchema.safeParse(formToObject(formData));
  if (!p.success) {
    const campos: Record<string, string> = {};
    for (const i of p.error.issues) campos[String(i.path[0] ?? "")] ||= i.message;
    return fail("Revise os campos destacados.", campos);
  }
  try {
    const r = await api<{ destinatarios: string[] }>(`/nfse/notas/${p.data.id}/enviar-email`, {
      method: "POST",
      body: { destinatarios: p.data.destinatarios, mensagem: p.data.mensagem || null },
    });
    revalidar(p.data.id);
    return ok(`E-mail enviado para ${r.destinatarios.join(", ")} (DANFSe e XML anexos).`);
  } catch (e) {
    return apiFail("nfse:email", e);
  }
}
