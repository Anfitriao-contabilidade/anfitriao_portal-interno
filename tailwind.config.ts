import type { Config } from "tailwindcss";

/**
 * Design tokens do Portal — mesma identidade do site institucional
 * (Fraunces + IBM Plex Sans/Mono, paleta em azul-oceano com acento dourado).
 * Todas as combinações de texto usadas passam no contraste WCAG AA (≥ 4,5:1).
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ocean: {
          DEFAULT: "#0f3d5c",
          deep: "#0a2b41",
          50: "#eef5fa",
          100: "#d8e7f1",
          600: "#15557f",
        },
        ink: {
          DEFAULT: "#12202b",
          soft: "#526270",
        },
        gold: {
          DEFAULT: "#c9963c",
          dark: "#8a6320", // versão acessível para texto sobre fundo claro
          50: "#fbf5ea",
        },
        paper: "#faf7f0",
        line: "#e3e8ec",
      },
      fontFamily: {
        display: ['"Fraunces Variable"', "Georgia", "serif"],
        body: ['"IBM Plex Sans"', "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,61,92,.04), 0 1px 3px rgba(15,61,92,.06)",
        pop: "0 10px 30px -10px rgba(10,43,65,.35)",
      },
      keyframes: {
        "slide-in": { from: { transform: "translateX(-100%)" }, to: { transform: "translateX(0)" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: {
        "slide-in": "slide-in .2s ease-out",
        "fade-in": "fade-in .15s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
