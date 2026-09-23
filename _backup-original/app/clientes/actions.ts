"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioEPapel } from "@/lib/admin";

/**
 * Atualiza o cadastro de um cliente já existente. Só a equipe (papel=admin)
 * pode chamar isso — checado aqui de novo além da policy de RLS
 * (profiles_update_own_or_admin), pelo mesmo motivo já documentado em
 * lib/admin.ts: evita uma falha silenciosa e permite avisar o admin com
 * clareza se algo mudar nas permissões.
 *
 * Escopo desta rodada (decisão do usuário): só edita cliente já existente —
 * criar cliente novo (conta de login) continua manual pelo painel do
 * Supabase, como já documentado no README.
 */
export async function atualizarCliente(formData: FormData) {
  const { isAdmin } = await getUsuarioEPapel();
  if (!isAdmin) return;

  const supabase = createClient();

  const id = String(formData.get("id") || "");
  if (!id) return;

  const nome = String(formData.get("nome") || "");
  const tipo = String(formData.get("tipo") || "PF");
  const documento = String(formData.get("documento") || "");
  const telefone = String(formData.get("telefone") || "");
  const endereco = String(formData.get("endereco") || "");
  const plano = String(formData.get("plano") || "");
  const statusFiscal = String(formData.get("status_fiscal") || "regular");
  const perfilAtuacao = String(formData.get("perfil_atuacao") || "proprietario");

  if (!nome) return;

  await supabase
    .from("profiles")
    .update({
      nome,
      tipo,
      documento,
      telefone,
      endereco,
      plano,
      status_fiscal: statusFiscal,
      perfil_atuacao: perfilAtuacao,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("papel", "cliente"); // nunca deixa editar um perfil de admin por engano por essa tela

  revalidatePath("/clientes");
}
