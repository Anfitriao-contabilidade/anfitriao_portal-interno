"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Adiciona um item de estoque a um imóvel. A RLS (0004_estoque.sql) já
 * garante que só o dono do imóvel ou a equipe (admin) conseguem inserir —
 * aqui só validamos os campos e devolvemos silenciosamente se faltar algo
 * essencial, seguindo o mesmo padrão dos outros formulários deste app.
 */
export async function adicionarItemEstoque(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const imovelId = String(formData.get("imovel_id") || "");
  const grupo = String(formData.get("grupo") || "").trim();
  const tipo = String(formData.get("tipo") || "").trim();
  if (!imovelId || !grupo || !tipo) return;

  const quantidadeRaw = Number(formData.get("quantidade"));
  const quantidade = Number.isFinite(quantidadeRaw) && quantidadeRaw >= 1 ? Math.round(quantidadeRaw) : 1;
  const nomeMarca = String(formData.get("nome_marca") || "").trim() || null;
  const valorRaw = formData.get("valor");
  const valor = valorRaw && String(valorRaw).trim() !== "" ? Number(valorRaw) : null;

  await supabase.from("estoque_itens").insert({
    imovel_id: imovelId,
    grupo,
    tipo,
    quantidade,
    nome_marca: nomeMarca,
    valor: valor !== null && Number.isFinite(valor) ? valor : null,
  });

  revalidatePath("/estoque");
}

export async function excluirItemEstoque(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = String(formData.get("id") || "");
  if (!id) return;

  await supabase.from("estoque_itens").delete().eq("id", id);
  revalidatePath("/estoque");
}
