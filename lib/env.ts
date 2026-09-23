import "server-only";
import { z } from "zod";

/**
 * Variáveis de ambiente do servidor, validadas uma única vez. Falha cedo e com
 * mensagem clara em vez de erros obscuros em runtime.
 *
 * O Portal não fala mais com banco nem com o Firebase diretamente: tudo passa
 * pela Anfitrião API (API_URL). Nenhuma dessas variáveis é NEXT_PUBLIC_*.
 */
const schema = z.object({
  API_URL: z.url({ message: "API_URL deve ser a URL da API, ex.: http://localhost:8000/api/v1" }),
  PORTAL_PROXY_SECRET: z.string().optional(),
  NEXT_PUBLIC_SITE_URL: z.url().optional(),
  API_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(15000),
});

let cached: z.infer<typeof schema> | null = null;

export function serverEnv() {
  if (cached) return cached;
  const parsed = schema.safeParse({
    API_URL: process.env.API_URL,
    PORTAL_PROXY_SECRET: process.env.PORTAL_PROXY_SECRET || undefined,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
    API_TIMEOUT_MS: process.env.API_TIMEOUT_MS || undefined,
  });
  if (!parsed.success) {
    const detalhes = parsed.error.issues.map((i) => `- ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Variáveis de ambiente inválidas (veja .env.example):\n${detalhes}`);
  }
  cached = { ...parsed.data, API_URL: parsed.data.API_URL.replace(/\/$/, "") };
  return cached;
}
