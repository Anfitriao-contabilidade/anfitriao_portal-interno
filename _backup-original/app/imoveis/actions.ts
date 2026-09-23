"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Mesma lógica do Painel Interno da equipe: o endereço estruturado (CEP, rua,
// número, bairro, cidade, UF) é a fonte de verdade; "endereco" continua
// existindo como um resumo textual derivado dele, para não quebrar quem já
// lia esse campo único.
function formatEnderecoImovel(
  rua: string,
  numero: string,
  bairro: string,
  cidade: string,
  uf: string,
  cep: string
) {
  const linha1 = [rua, numero].filter(Boolean).join(", ");
  let partes = [linha1, bairro, [cidade, uf].filter(Boolean).join("/")]
    .filter(Boolean)
    .join(" - ");
  if (cep) partes = partes ? `${partes} - CEP ${cep}` : `CEP ${cep}`;
  return partes;
}

function camposImovelDe(formData: FormData) {
  const nome = String(formData.get("nome") || "").trim();
  const taxaGestaoPct = Number(formData.get("taxa_gestao_pct") || 18);
  const plataformasRaw = String(formData.get("plataformas") || "");
  const plataformas = plataformasRaw
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);

  const cep = String(formData.get("cep") || "").trim();
  const rua = String(formData.get("rua") || "").trim();
  const numero = String(formData.get("numero") || "").trim();
  const bairro = String(formData.get("bairro") || "").trim();
  const cidade = String(formData.get("cidade") || "").trim();
  const uf = String(formData.get("uf") || "").trim() || null;

  const tipo = String(formData.get("tipo") || "").trim() || null;
  const condicao = String(formData.get("condicao") || "").trim() || null;
  const metragemRaw = formData.get("metragem");
  const quartosRaw = formData.get("quartos");
  const salasRaw = formData.get("salas");
  const banheirosRaw = formData.get("banheiros");

  return {
    nome,
    endereco: formatEnderecoImovel(rua, numero, bairro, cidade, uf || "", cep),
    taxa_gestao_pct: isNaN(taxaGestaoPct) ? 18 : taxaGestaoPct,
    plataformas,
    cep: cep || null,
    rua: rua || null,
    numero: numero || null,
    bairro: bairro || null,
    cidade: cidade || null,
    uf,
    tipo,
    condicao,
    metragem: metragemRaw && String(metragemRaw) !== "" ? Number(metragemRaw) : null,
    quartos: quartosRaw && String(quartosRaw) !== "" ? Number(quartosRaw) : null,
    salas: salasRaw && String(salasRaw) !== "" ? Number(salasRaw) : null,
    banheiros: banheirosRaw && String(banheirosRaw) !== "" ? Number(banheirosRaw) : null,
  };
}

export async function adicionarImovel(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const campos = camposImovelDe(formData);
  if (!campos.nome) return;

  await supabase.from("imoveis").insert({
    owner_id: user.id,
    ...campos,
  });

  revalidatePath("/imoveis");
  revalidatePath("/rentabilidade");
  revalidatePath("/clientes");
}

export async function editarImovel(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = String(formData.get("id") || "");
  if (!id) return;

  const campos = camposImovelDe(formData);
  if (!campos.nome) return;

  await supabase.from("imoveis").update(campos).eq("id", id).eq("owner_id", user.id);

  revalidatePath("/imoveis");
  revalidatePath("/rentabilidade");
  revalidatePath("/clientes");
}

export async function excluirImovel(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = String(formData.get("id") || "");
  if (!id) return;

  await supabase.from("imoveis").delete().eq("id", id).eq("owner_id", user.id);
  revalidatePath("/imoveis");
}
