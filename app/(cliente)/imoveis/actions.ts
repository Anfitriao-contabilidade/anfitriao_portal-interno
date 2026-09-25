"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { api } from "@/lib/api";
import { apiFail, fail, formToObject, invalid, ok, zodFieldErrors, type ActionState } from "@/lib/actions";
import { imovelSchema, objectId, proprietarioExternoSchema, type ImovelInput } from "@/lib/validation";

/** Corpo aceito pela API (o resumo textual "endereco" é calculado lá). */
function toBody(d: ImovelInput) {
  return {
    nome: d.nome,
    taxa_gestao_pct: d.taxa_gestao_pct,
    plataformas: d.plataformas.filter((p) => p.length >= 2),
    cep: d.cep ?? null,
    rua: d.rua ?? null,
    numero: d.numero ?? null,
    bairro: d.bairro ?? null,
    cidade: d.cidade ?? null,
    uf: d.uf ?? null,
    tipo: d.tipo ?? null,
    condicao: d.condicao ?? null,
    metragem: d.metragem ?? null,
    quartos: d.quartos ?? null,
    salas: d.salas ?? null,
    banheiros: d.banheiros ?? null,
  };
}

function revalidar() {
  revalidatePath("/imoveis");
  revalidatePath("/");
  revalidatePath("/rentabilidade");
  revalidatePath("/clientes");
}

export async function adicionarImovel(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const sessao = await requireUser();
  const dados = formToObject(formData);
  const parsed = imovelSchema.safeParse(dados);
  if (!parsed.success) return invalid(parsed.error);
  const body: Record<string, unknown> = toBody(parsed.data);

  // Imóvel de terceiro (proprietário sem conta): obrigatório para quem é só
  // co-anfitrião; opcional para quem acumula os dois papéis.
  const deTerceiro = dados.de_terceiro === "on" || (sessao.isCoanfitriao && !sessao.isProprietario && !sessao.isAdmin);
  if (sessao.isAdmin && !deTerceiro) {
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(dados.proprietario_id ?? "")) {
      return fail("Revise os campos destacados.", { proprietario_id: "Selecione o proprietário" });
    }
    body.proprietario_id = dados.proprietario_id;
  }
  if (deTerceiro) {
    const prop = proprietarioExternoSchema.safeParse(dados);
    if (!prop.success) return fail("Informe os dados do proprietário do imóvel.", zodFieldErrors(prop.error));
    body.proprietario_externo = {
      nome: prop.data.prop_nome,
      documento: prop.data.prop_documento ?? null,
      email: prop.data.prop_email ?? null,
      telefone: prop.data.prop_telefone ?? null,
    };
  }

  try {
    await api("/imoveis", { method: "POST", body });
  } catch (e) {
    return apiFail("imovel:add", e);
  }
  revalidar();
  return ok(`Imóvel “${parsed.data.nome}” cadastrado.`);
}

export async function editarImovel(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const id = objectId.safeParse(formData.get("id"));
  if (!id.success) return fail("Imóvel inválido.");
  const parsed = imovelSchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);

  const body: Record<string, unknown> = toBody(parsed.data);
  // Campo desabilitado (co-anfitrião de imóvel com proprietário cadastrado) não é
  // enviado pelo navegador: não mandamos a taxa para a API recusar.
  if (!formData.has("taxa_gestao_pct")) delete body.taxa_gestao_pct;

  try {
    await api(`/imoveis/${id.data}`, { method: "PATCH", body });
  } catch (e) {
    return apiFail("imovel:edit", e);
  }
  revalidar();
  return ok("Alterações salvas.");
}

export async function excluirImovel(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const id = objectId.safeParse(formData.get("id"));
  if (!id.success) return fail("Imóvel inválido.");

  try {
    await api(`/imoveis/${id.data}`, { method: "DELETE" });
  } catch (e) {
    return apiFail("imovel:delete", e);
  }
  revalidar();
  return ok("Imóvel removido.");
}

export async function vincularCoanfitriao(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const id = objectId.safeParse(formData.get("id"));
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!id.success) return fail("Imóvel inválido.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return fail("Revise os campos destacados.", { email: "Informe um e-mail válido" });
  }
  try {
    await api(`/imoveis/${id.data}/coanfitrioes`, { method: "POST", body: { email } });
  } catch (e) {
    return apiFail("imovel:coanfitriao", e);
  }
  revalidar();
  return ok("Co-anfitrião vinculado.");
}

export async function desvincularCoanfitriao(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const id = objectId.safeParse(formData.get("imovel_id"));
  const usuario = String(formData.get("id") ?? "");
  if (!id.success || !/^[A-Za-z0-9_-]{1,128}$/.test(usuario)) return fail("Dados inválidos.");
  try {
    await api(`/imoveis/${id.data}/coanfitrioes/${usuario}`, { method: "DELETE" });
  } catch (e) {
    return apiFail("imovel:desvincular", e);
  }
  revalidar();
  return ok("Co-anfitrião removido do imóvel.");
}
