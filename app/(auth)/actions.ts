"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api";
import { apagarSessao, gravarSessao, lerSessao } from "@/lib/session";
import { apiFail, fail, invalid, ok, formToObject, type ActionState } from "@/lib/actions";
import { cadastroSchema, loginSchema, novaSenhaSchema, recuperarSenhaSchema, trocarSenhaSchema } from "@/lib/validation";
import { rateLimit, resetRateLimit } from "@/lib/security/rate-limit";
import { destinoAposLogin } from "@/lib/security/url";
import { requireUser } from "@/lib/auth";
import type { SessaoResposta } from "@/lib/tipos";

const QUINZE_MIN = 15 * 60 * 1000;
const UMA_HORA = 60 * 60 * 1000;

async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "desconhecido").trim();
}

/** Mensagens de login: só revelam o estado da conta a quem acertou a senha (a API decide). */
const MSG_LOGIN: Record<string, string> = {
  credenciais_invalidas: "E-mail ou senha incorretos.",
};

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { email, password, next } = parsed.data;

  const ip = await clientIp();
  const porConta = rateLimit(`login:${ip}:${email}`, 5, QUINZE_MIN);
  const porIp = rateLimit(`login-ip:${ip}`, 30, QUINZE_MIN);
  if (!porConta.allowed || !porIp.allowed) {
    const min = Math.ceil(Math.max(porConta.retryAfterSec, porIp.retryAfterSec) / 60);
    return fail(`Muitas tentativas. Por segurança, aguarde ${min} min e tente novamente.`);
  }

  let destino = "/";
  try {
    const r = await api<SessaoResposta>("/auth/login", {
      method: "POST",
      body: { email, senha: password },
      autenticado: false,
    });
    await gravarSessao(r.sessao, r.expira_em);
    destino = destinoAposLogin(r.usuario.papeis, next);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403 || e.status === 429)) {
      return fail(MSG_LOGIN[e.code] ?? e.message);
    }
    return apiFail("auth:login", e);
  }

  resetRateLimit(`login:${ip}:${email}`);
  revalidatePath("/", "layout");
  redirect(destino);
}

export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = cadastroSchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const d = parsed.data;

  const ip = await clientIp();
  const limite = rateLimit(`cadastro:${ip}`, 5, UMA_HORA);
  if (!limite.allowed) return fail("Muitos cadastros a partir desta conexão. Tente novamente mais tarde.");

  const papeis = d.perfil_atuacao === "ambos" ? ["proprietario", "coanfitriao"] : [d.perfil_atuacao];
  try {
    await api("/auth/cadastro", {
      method: "POST",
      autenticado: false,
      body: {
        nome: d.nome,
        email: d.email,
        senha: d.password,
        papeis,
        tipo: d.tipo,
        documento: d.documento ?? null,
        telefone: d.telefone ?? null,
        aceite_termos: true,
      },
    });
  } catch (e) {
    return apiFail("auth:cadastro", e, { senha: "password" });
  }
  redirect("/login?cadastro=1");
}

export async function signOut() {
  if (await lerSessao()) {
    try {
      await api("/auth/logout", { method: "POST" }); // revoga as sessões na API
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 401)) console.error("[auth:logout]", e);
    }
  }
  await apagarSessao();
  revalidatePath("/", "layout");
  redirect("/login?saiu=1");
}

export async function requestPasswordReset(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = recuperarSenhaSchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);

  const ip = await clientIp();
  const limite = rateLimit(`reset:${ip}`, 5, QUINZE_MIN);
  const genericOk = ok(
    "Se este e-mail estiver cadastrado, você receberá em instantes um link para criar uma nova senha. Confira também a caixa de spam."
  );
  if (!limite.allowed) return genericOk; // resposta idêntica — não sinaliza nada a um atacante

  try {
    await api("/auth/recuperar-senha", { method: "POST", body: { email: parsed.data.email }, autenticado: false });
  } catch (e) {
    console.error("[auth:reset]", e instanceof ApiError ? e.code : e);
  }
  return genericOk;
}

/** Nova senha a partir do link do e-mail (código oobCode do Firebase; sem login). */
export async function resetPasswordWithCode(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = novaSenhaSchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const codigo = String(formData.get("codigo") ?? "");
  if (!/^[A-Za-z0-9_-]{10,512}$/.test(codigo)) return fail("Link inválido. Solicite um novo em “Esqueci minha senha”.");

  try {
    await api("/auth/redefinir-senha", {
      method: "POST",
      autenticado: false,
      body: { codigo, nova_senha: parsed.data.password },
    });
  } catch (e) {
    if (e instanceof ApiError && e.code === "link_invalido") {
      return fail("O link expirou ou já foi usado. Solicite um novo em “Esqueci minha senha”.");
    }
    return apiFail("auth:reset-code", e, { nova_senha: "password" });
  }
  redirect("/login?senha=1");
}

/** Troca de senha de quem está logado (exige a senha atual). */
export async function changePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = trocarSenhaSchema.safeParse(formToObject(formData));
  if (!parsed.success) return invalid(parsed.error);

  try {
    const r = await api<SessaoResposta>("/auth/alterar-senha", {
      method: "POST",
      body: { senha_atual: parsed.data.current, nova_senha: parsed.data.password },
    });
    await gravarSessao(r.sessao, r.expira_em); // sessões antigas foram encerradas pela API
  } catch (e) {
    if (e instanceof ApiError && e.code === "senha_atual_incorreta") {
      return fail("Senha atual incorreta.", { current: "Senha atual incorreta" });
    }
    return apiFail("auth:change-password", e, { nova_senha: "password", senha_atual: "current" });
  }
  return ok("Senha alterada. Por segurança, as outras sessões abertas foram encerradas.");
}
