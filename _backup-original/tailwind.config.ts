import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ocean: "#0f3d5c",
        "ocean-deep": "#0a2b41",
        ink: "#12202b",
        "ink-soft": "#5b6b76",
        gold: "#c9963c",
        paper: "#faf7f0",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["IBM Plex Sans", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
