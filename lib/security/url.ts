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
