import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portal do Cliente — Anfitrião Gestão e Contabilidade",
  description: "Perfil, imóveis, rentabilidade e situação fiscal em um só lugar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
