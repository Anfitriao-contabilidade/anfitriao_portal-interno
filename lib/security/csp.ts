/**
 * Content-Security-Policy com nonce por requisição (scripts só executam se
 * vierem do próprio Next.js com o nonce correto — bloqueia XSS injetado).
 */
export function buildCsp(nonce: string, isDev: boolean, isHttps = true) {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...(isDev ? ["'unsafe-eval'"] : [])],
    // Estilos inline são usados pelo Next/React (atributo style); não executam código.
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'", "data:"],
    // O navegador só fala com o próprio portal; a API é chamada pelo servidor do Next.js.
    "connect-src": ["'self'", ...(isDev ? ["ws:", "wss:"] : [])],
    "frame-src": ["'none'"],
    "frame-ancestors": ["'none'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "manifest-src": ["'self'"],
    "worker-src": ["'self'", "blob:"],
  };
  const policy = Object.entries(directives)
    .map(([k, v]) => `${k} ${v.join(" ")}`)
    .join("; ");
  // upgrade-insecure-requests só faz sentido (e só é seguro) quando o site já é servido em HTTPS.
  return !isDev && isHttps ? `${policy}; upgrade-insecure-requests` : policy;
}
