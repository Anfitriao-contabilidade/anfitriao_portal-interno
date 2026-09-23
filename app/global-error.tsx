"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "3rem 1.5rem", textAlign: "center", color: "#12202b" }}>
        <h1 style={{ fontSize: "1.5rem" }}>O portal está temporariamente indisponível</h1>
        <p style={{ color: "#526270" }}>Tente novamente em alguns instantes.</p>
        <button
          onClick={reset}
          style={{ marginTop: "1rem", padding: ".6rem 1.2rem", borderRadius: 8, border: 0, background: "#0f3d5c", color: "#fff" }}
        >
          Tentar novamente
        </button>
      </body>
    </html>
  );
}
