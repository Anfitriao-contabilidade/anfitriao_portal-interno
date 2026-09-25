import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { api, sessaoPerdida } from "@/lib/api";
import { lerSessao } from "@/lib/session";
import type { Papel, Usuario } from "@/lib/tipos";

export type SessaoUsuario = {
  id: string;
  email: string | null;
  nome: string;
  papeis: Papel[];
  isAdmin: boolean;
  isProprietario: boolean;
  isCoanfitriao: boolean;
  visaoSimulada?: "proprietario" | "coanfitriao" | null;
  usuario: Usuario;
};

/**
 * Usuário autenticado, resolvido UMA vez por requisição (React cache) com
 * GET /me — a API valida o cookie de sessão do Firebase (assinatura,
 * expiração, revogação) e confere o cadastro ativo no MongoDB.
 */
export const getSessao = cache(async (): Promise<SessaoUsuario | null> => {
  if (!(await lerSessao())) return null;
  try {
    const u = await api<Usuario>("/me");
    return {
      id: u.id,
      email: u.email,
      nome: u.nome || u.email || "Cliente",
      papeis: u.papeis,
      isAdmin: u.papeis.includes("admin"),
      isProprietario: u.papeis.includes("proprietario"),
      isCoanfitriao: u.papeis.includes("coanfitriao"),
      usuario: u,
    };
  } catch (e) {
    if (sessaoPerdida(e)) return null;
    throw e;
  }
});

/**
 * Exige sessão válida. Sem ela, encerra o cookie local (rota que pode gravar
 * cookies) e manda para o login. Use no topo de páginas e actions.
 */
export async function requireUser(): Promise<SessaoUsuario> {
  const sessao = await getSessao();
  if (!sessao) redirect((await lerSessao()) ? "/auth/sessao-expirada" : "/login");
  return sessao;
}

/**
 * Checagem de papel para telas/ações da equipe. A API aplica a MESMA regra
 * (403 para não-admin) — checar aqui só permite mostrar uma mensagem clara.
 */
export async function getSessaoAdmin(): Promise<SessaoUsuario | null> {
  const sessao = await requireUser();
  return sessao.isAdmin ? sessao : null;
}
