"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessaoAdmin } from "@/lib/auth";
import { api } from "@/lib/api";
import { apiFail, fail, formToObject, invalid, ok, type ActionState } from "@/lib/actions";
import { objectId } from "@/lib/validation";

const SO_EQUIPE = "Apenas a equipe edita os planos.";

const secaoSchema = z.object({
  eyebrow: z.string().trim().min(1, "Informe o texto curto").max(160),
  titulo: z.string().trim().min(1, "Informe o título").max(160),
  subtitulo: z.string().trim().min(1, "Informe o subtítulo").max(400),
  nota: z.string().trim().min(1, "Informe a nota").max(400),
});

const planoSchema = z.object({
  ordem: z.string().trim().regex(/^\d{1,2}$/, "Ordem de 0 a 99"),
  nivel: z.string().trim().min(1, "Informe o nível").max(40),
  titulo: z.string().trim().min(1, "Informe o título").max(200),
  descricao: z.string().trim().min(1, "Informe a descrição").max(300),
  tag_oferta: z.string().trim().max(40).optional().or(z.literal("")),
  preco_oficial: z.string().trim().min(1, "Informe o preço oficial"),
  preco_atual: z.string().trim().min(1, "Informe o preço atual"),
  faturamento: z.string().trim().min(1, "Informe a faixa").max(120),
  botao: z.string().trim().min(1, "Informe o botão").max(60),
});

function dinheiro(valor: string) {
  const n = Number(valor.replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return n.toFixed(2);
}

function beneficiosDe(formData: FormData) {
  return formData
    .getAll("beneficios")
    .map((item) => String(item).trim())
    .filter(Boolean);
}

function corpo(d: z.infer<typeof planoSchema>, formData: FormData) {
  const oficial = dinheiro(d.preco_oficial);
  const atual = dinheiro(d.preco_atual);
  const beneficios = beneficiosDe(formData);
  if (!oficial || !atual) return { erro: "Informe os preços em reais." };
  if (beneficios.length === 0) return { erro: "Inclua ao menos um benefício." };
  return {
    ordem: Number(d.ordem),
    nivel: d.nivel,
    titulo: d.titulo,
    descricao: d.descricao,
    mais_escolhido: formData.get("mais_escolhido") === "on",
    tag_oferta: d.tag_oferta || null,
    preco_oficial: oficial,
    preco_atual: atual,
    beneficios,
    faturamento: d.faturamento,
    botao: d.botao,
  };
}

function revalidar() {
  revalidatePath("/admin/planos");
}

export async function salvarSecaoPlanos(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await getSessaoAdmin())) return fail(SO_EQUIPE);
  const parsed = secaoSchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  try {
    await api("/planos/secao", { method: "PUT", body: parsed.data });
  } catch (e) {
    return apiFail("plano:secao", e);
  }
  revalidar();
  return ok("Textos da seção atualizados.");
}

export async function criarPlano(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await getSessaoAdmin())) return fail(SO_EQUIPE);
  const parsed = planoSchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const body = corpo(parsed.data, formData);
  if ("erro" in body) return fail(body.erro);
  try {
    await api("/planos", { method: "POST", body });
  } catch (e) {
    return apiFail("plano:criar", e);
  }
  revalidar();
  return ok("Plano criado.");
}

export async function atualizarPlano(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await getSessaoAdmin())) return fail(SO_EQUIPE);
  const id = objectId.safeParse(formData.get("id"));
  if (!id.success) return fail("Plano inválido.");
  const parsed = planoSchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const body = corpo(parsed.data, formData);
  if ("erro" in body) return fail(body.erro);
  try {
    await api(`/planos/${id.data}`, { method: "PATCH", body });
  } catch (e) {
    return apiFail("plano:atualizar", e);
  }
  revalidar();
  return ok("Plano atualizado.");
}

export async function removerPlano(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await getSessaoAdmin())) return fail(SO_EQUIPE);
  const id = objectId.safeParse(formData.get("id"));
  if (!id.success) return fail("Plano inválido.");
  try {
    await api(`/planos/${id.data}`, { method: "DELETE" });
  } catch (e) {
    return apiFail("plano:remover", e);
  }
  revalidar();
  return ok("Plano excluído.");
}
