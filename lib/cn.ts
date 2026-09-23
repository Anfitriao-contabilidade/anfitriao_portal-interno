/** Junta classes condicionais (sem dependência externa). */
export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
