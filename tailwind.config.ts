import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        primary: "var(--color-primary)",
        primaryHover: "var(--color-primary-hover)",
        primaryLight: "var(--color-primary-light)",
        textMain: "var(--color-text-main)",
        textMuted: "var(--color-text-muted)",
        border: "var(--color-border)",
        error: "var(--color-error)",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;