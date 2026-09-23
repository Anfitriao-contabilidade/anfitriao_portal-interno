"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function atualizarPerfil(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const nome = String(formData.get("nome") || "");
  const tipo = String(formData.get("tipo") || "PF");
  const documento = String(formData.get("documento") || "");
  const telefone = String(formData.get("telefone") || "");
  const endereco = String(formData.get("endereco") || "");

  await supabase
    .from("profiles")
    .update({
      nome,
      tipo,
      documento,
      telefone,
      endereco,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", user.id);

  revalidatePath("/perfil");
}
