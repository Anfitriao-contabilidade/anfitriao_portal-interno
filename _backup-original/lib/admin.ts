import { createClient } from "@/lib/supabase/server";

/**
 * Confere se o usuário autenticado é da equipe (papel = 'admin' em
 * profiles). Usado nas telas/actions administrativas — é a MESMA regra já
 * imposta pelas policies de RLS (is_admin() no banco); checar aqui de novo
 * só evita uma chamada ao banco que vai falhar silenciosamente e permite
 * mostrar uma mensagem clara em vez de uma tela vazia.
 */
export async function getUsuarioEPapel() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, isAdmin: false };

  const { data: perfil } = await supabase.from("profiles").select("papel").eq("id", user.id).single();

  return { user, isAdmin: perfil?.papel === "admin" };
}
