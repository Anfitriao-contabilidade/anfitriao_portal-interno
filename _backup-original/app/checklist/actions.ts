"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Salva o checklist de prontidão de um imóvel inteiro de uma vez (um único
 * formulário por imóvel, com todas as ~83 checkboxes) — a RLS
 * (0005_checklist_apto.sql) já garante que só o dono do imóvel ou a equipe
 * (admin) conseguem gravar. Como este app é só componentes de servidor (sem
 * JS no cliente), não dá para salvar cada checkbox individualmente ao
 * marcar/desmarcar — o formulário inteiro é enviado de uma vez com o botão
 * "Salvar checklist".
 *
 * Os nomes dos checkboxes marcados chegam todos com name="item" (mesmo
 * name, valores "c<categoria>_i<item>"); os desmarcados simplesmente não
 * aparecem no FormData — por isso o objeto salvo é reconstruído do zero a
 * cada envio (equivalente a um "set" completo, não um merge parcial).
 */
export async function salvarChecklistApto(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const imovelId = String(formData.get("imovel_id") || "");
  if (!imovelId) return;

  const itens: Record<string, boolean> = {};
  for (const key of formData.getAll("item")) {
    itens[String(key)] = true;
  }

  await supabase.from("checklist_apto").upsert({
    imovel_id: imovelId,
    itens,
    atualizado_em: new Date().toISOString(),
  });

  revalidatePath("/checklist");
  revalidatePath("/clientes");
}
