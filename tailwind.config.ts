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
          DEFAULT: "#1f5c82",
          deep: "#143e5c",
          bright: "#155a86",
          50: "#e7f1f6",
          100: "#cfe3ec",
          600: "#1a5274",
        },
        ink: {
          DEFAULT: "#0b2540",
          soft: "#3d5972",
        },
        gold: {
          DEFAULT: "#b97a22",
          dark: "#8a5414",
          50: "#f1dfc0",
        },
        ok: {
          DEFAULT: "#1f7a45",
          soft: "#dcf1e4",
        },
        danger: {
          DEFAULT: "#a32015",
          soft: "#f8ddd8",
        },
        paper: "#f5f7f6",
        raised: "#ffffff",
        line: "#d3dee3",
        menu: {
          DEFAULT: "#0b2340",
          muted: "#c5d4e0",
          accent: "#c0560c",
        },
      },
      borderRadius: {
        card: "14px",
      },
      maxWidth: {
        shell: "85rem",
      },
      screens: {
        nav: "960px",
      },
      fontFamily: {
        display: ['"Fraunces Variable"', "Georgia", "serif"],
        body: ['"IBM Plex Sans"', "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,37,64,.05), 0 8px 24px -16px rgba(11,37,64,.35)",
        pop: "0 10px 30px -10px rgba(11,37,64,.4)",
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
