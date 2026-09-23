import type { NextConfig } from "next";

/**
 * Cabeçalhos de segurança estáticos, aplicados a todas as rotas.
 * A Content-Security-Policy (que depende de um nonce por requisição) é
 * montada no middleware — ver lib/security/csp.ts.
 */
const securityHeaders = [
  // Força HTTPS por 2 anos (inclui subdomínios). Só tem efeito em HTTPS.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Impede o navegador de "adivinhar" o tipo de conteúdo.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Anti-clickjacking (reforçado por frame-ancestors 'none' na CSP).
  { key: "X-Frame-Options", value: "DENY" },
  // Não vaza a URL completa (que pode conter IDs) para sites externos.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Desliga APIs do navegador que o portal não usa.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  // Portal privado: não deve aparecer em buscadores.
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    serverActions: {
      // Formulários do portal são pequenos — limite baixo reduz abuso.
      bodySizeLimit: "1mb",
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
