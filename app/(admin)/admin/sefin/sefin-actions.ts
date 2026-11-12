"use server";

/**
 * Server Actions da Integração SEFIN. O Portal nunca fala com a Sefin: tudo passa pela Anfitrião API
 * (/nfse/integracao), que usa o certificado do prestador e respeita o ambiente ativo.
 * Nada aqui recebe, devolve ou registra senha, PFX ou chave privada.
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessaoAdmin } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import type { AmbienteAtivo, ConsultaResultado, ValidacaoCertificado } from "@/lib/nfse";
import { objectId } from "@/lib/validation";

export type Resultado<T> = { ok: true; dados: T } | { ok: false; erro: string; codigo?: string };

const SO_EQUIPE = "Apenas a equipe da Anfitrião pode operar a integração com a Sefin.";

function erro(e: unknown, contexto: string): { ok: false; erro: string; codigo?: string } {
  if (e instanceof ApiError) {
    if (e.status < 500 || e.status === 503) return { ok: false, erro: e.message, codigo: e.code };
    console.error(`[sefin:${contexto}]`, e.status, e.code, e.requestId);
    return { ok: false, erro: `Não foi possível concluir agora.${e.requestId ? ` (código ${e.requestId.slice(0, 8)})` : ""}` };
  }
  console.error(`[sefin:${contexto}]`, e);
  return { ok: false, erro: "Não foi possível concluir agora." };
}

const prestadorOpt = objectId.optional().or(z.literal("").transform(() => undefined));

const ambienteSchema = z
  .object({
    ambiente: z.enum(["homologacao", "producao"]),
    versao_esperada: z.number().int().min(0),
    motivo: z.string().max(200).optional(),
    confirmacao: z.string().max(20).optional(),
  })
  .strict();

export async function alterarAmbienteSefin(dados: unknown): Promise<Resultado<AmbienteAtivo>> {
  if (!(await getSessaoAdmin())) return { ok: false, erro: SO_EQUIPE };
  const p = ambienteSchema.safeParse(dados);
  if (!p.success) return { ok: false, erro: "Dados inválidos." };
  try {
    const r = await api<AmbienteAtivo>("/nfse/integracao/ambiente", {
      method: "PUT",
      body: { ...p.data, motivo: p.data.motivo || undefined, confirmacao: p.data.confirmacao || undefined },
    });
    // O ambiente vale para TODAS as telas fiscais: revalida o que depende dele.
    revalidatePath("/admin/sefin");
    revalidatePath("/admin/notas", "layout");
    return { ok: true, dados: r };
  } catch (e) {
    return erro(e, "ambiente");
  }
}

export async function validarCertificadoSefin(prestadorId: string, testarSefin: boolean): Promise<Resultado<ValidacaoCertificado>> {
  if (!(await getSessaoAdmin())) return { ok: false, erro: SO_EQUIPE };
  const id = prestadorOpt.safeParse(prestadorId);
  if (!id.success) return { ok: false, erro: "Prestador inválido." };
  try {
    const r = await api<ValidacaoCertificado>("/nfse/integracao/certificado/validar", {
      method: "POST",
      body: { prestador_id: id.data, testar_sefin: testarSefin },
    });
    revalidatePath("/admin/sefin");
    return { ok: true, dados: r };
  } catch (e) {
    return erro(e, "validar");
  }
}

const chave = z.string().regex(/^\d{50}$/, "A chave de acesso tem 50 dígitos.");

export async function consultarSefin(
  tipo: "nfse" | "dps" | "evento",
  prestadorId: string,
  campos: { chave_acesso?: string; id_dps?: string; tipo_evento?: number; num_seq_evento?: number }
): Promise<Resultado<ConsultaResultado>> {
  if (!(await getSessaoAdmin())) return { ok: false, erro: SO_EQUIPE };
  const pid = prestadorOpt.safeParse(prestadorId);
  if (!pid.success) return { ok: false, erro: "Prestador inválido." };
  let body: Record<string, unknown>;
  if (tipo === "nfse") {
    const c = chave.safeParse((campos.chave_acesso ?? "").replace(/\D/g, ""));
    if (!c.success) return { ok: false, erro: c.error.issues[0].message };
    body = { prestador_id: pid.data, chave_acesso: c.data };
  } else if (tipo === "dps") {
    const d = z.string().regex(/^DPS\d{42}$/, "O Id da DPS começa com DPS e tem 42 dígitos.").safeParse((campos.id_dps ?? "").trim());
    if (!d.success) return { ok: false, erro: d.error.issues[0].message };
    body = { prestador_id: pid.data, id_dps: d.data };
  } else {
    const c = chave.safeParse((campos.chave_acesso ?? "").replace(/\D/g, ""));
    if (!c.success) return { ok: false, erro: c.error.issues[0].message };
    const t = z.number().int().safeParse(campos.tipo_evento);
    const s = z.number().int().min(1).max(999).safeParse(campos.num_seq_evento ?? 1);
    if (!t.success || !s.success) return { ok: false, erro: "Informe o tipo de evento e o número sequencial (1 a 999)." };
    body = { prestador_id: pid.data, chave_acesso: c.data, tipo_evento: t.data, num_seq_evento: s.data };
  }
  try {
    const r = await api<ConsultaResultado>(`/nfse/integracao/consultas/${tipo}`, { method: "POST", body });
    revalidatePath("/admin/sefin");
    return { ok: true, dados: r };
  } catch (e) {
    return erro(e, `consulta-${tipo}`);
  }
}
