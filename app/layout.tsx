import type { Metadata, Viewport } from "next";
import "@fontsource-variable/fraunces";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";
import { HydrationMarker } from "@/components/HydrationMarker";

// Fontes são servidas pelo próprio app (sem Google Fonts em runtime):
// melhor privacidade (LGPD — nenhum IP do cliente vai para terceiros),
// CSP mais restrita e nenhum bloqueio de renderização por rede externa.

// A CSP usa um nonce novo a cada requisição; páginas estáticas não teriam
// o nonce nos scripts. Por isso toda a aplicação é renderizada sob demanda.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Portal do Cliente — Anfitrião Gestão e Contabilidade",
    template: "%s · Portal Anfitrião",
  },
  description: "Perfil, imóveis, rentabilidade e situação fiscal em um só lugar.",
  robots: { index: false, follow: false },
  applicationName: "Portal Anfitrião",
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f3d5c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <HydrationMarker />
      </body>
    </html>
  );
}
