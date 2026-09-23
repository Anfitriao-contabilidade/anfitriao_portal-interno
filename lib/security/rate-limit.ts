import "server-only";

/**
 * Limitador de tentativas em memória (janela deslizante), usado como defesa
 * em profundidade no login, cadastro e recuperação de senha. A API (e o Firebase Auth) já
 * aplicam os próprios limites; este aqui corta abuso antes
 * de chegar lá.
 *
 * Observação: em ambiente serverless com várias instâncias, cada instância
 * tem sua própria memória. Para um limite global, troque por Redis/Upstash
 * mantendo esta mesma interface.
 */
type Bucket = { hits: number[] };
const buckets = new Map<string, Bucket>();
const MAX_KEYS = 10_000;

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);

  if (bucket.hits.length >= limit) {
    const retryAfterMs = windowMs - (now - bucket.hits[0]);
    buckets.set(key, bucket);
    return { allowed: false, retryAfterSec: Math.ceil(retryAfterMs / 1000) };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  if (buckets.size > MAX_KEYS) {
    const oldest = buckets.keys().next().value;
    if (oldest) buckets.delete(oldest);
  }
  return { allowed: true, retryAfterSec: 0 };
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}
