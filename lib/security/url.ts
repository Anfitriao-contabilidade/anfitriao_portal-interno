import type { Papel } from "@/lib/tipos";

/** Home conforme o papel: equipe entra no painel interno. */
export function homeDoPapel(papeis: readonly Papel[]): string {
  return papeis.includes("admin") ? "/admin" : "/";
}

/**
 * Destino pós-login. `next` só vale se o papel puder abrir aquela área:
 * admin puro não cai no portal do cliente, e cliente não entra em /admin.
 */
export function destinoAposLogin(papeis: readonly Papel[], next: unknown): string {
  const home = homeDoPapel(papeis);
  const destino = safeInternalPath(next, home);
  const caminho = destino.split("?")[0];
  const areaAdmin = caminho === "/admin" || caminho.startsWith("/admin/");
  const ehAdmin = papeis.includes("admin");
  const ehCliente = papeis.includes("proprietario") || papeis.includes("coanfitriao");
  if (areaAdmin && !ehAdmin) return home;
  if (!areaAdmin && ehAdmin && !ehCliente) return home;
  return destino;
}

/**
 * Aceita só caminhos internos ("/imoveis", "/impostos?x=1") como destino de
 * redirecionamento — bloqueia open redirect ("//evil.com", "https://…",
 * "/\\evil.com").
 */
export function safeInternalPath(raw: unknown, fallback = "/"): string {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 512) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(raw)) return fallback;
  return raw;
}

/**
 * Só deixa passar links externos https (ex.: PDF da nota fiscal devolvido
 * pelo provedor). Impede `javascript:` e outros esquemas perigosos em href.
 */
export function safeExternalUrl(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw) return null;
  try {
    const u = new URL(raw);
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}
