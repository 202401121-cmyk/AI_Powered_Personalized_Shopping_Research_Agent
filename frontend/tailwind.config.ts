import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "var(--canvas)",
        surface: {
          DEFAULT: "var(--surface)",
          2: "var(--surface-2)",
        },
        line: {
          DEFAULT: "var(--line)",
          strong: "var(--line-strong)",
        },
        ink: {
          DEFAULT: "var(--ink)",
          2: "var(--ink-2)",
        },
        muted: "var(--muted)",
        brand: {
          DEFAULT: "var(--brand)",
          hover: "var(--brand-hover)",
          soft: "var(--brand-soft)",
          "on-brand": "var(--on-brand)",
        },
        evidence: {
          disputed: {
            ink: "var(--evidence-disputed-ink)",
            bg: "var(--evidence-disputed-bg)",
          },
          estimated: {
            ink: "var(--evidence-estimated-ink)",
            bg: "var(--evidence-estimated-bg)",
          },
          unverified: {
            ink: "var(--evidence-unverified-ink)",
            bg: "var(--evidence-unverified-bg)",
          },
          info: {
            ink: "var(--evidence-info-ink)",
            bg: "var(--evidence-info-bg)",
          },
        },
      },
      fontFamily: {
        display: ["var(--font-schibsted)", "sans-serif"],
        body: ["var(--font-public-sans)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      borderRadius: {
        card: "14px",
        control: "10px",
        pill: "9999px",
      },
      boxShadow: {
        composer: "0 12px 32px -18px rgba(14, 23, 38, 0.35)",
        popover: "0 12px 32px -18px rgba(14, 23, 38, 0.35)",
      },
      maxWidth: {
        column: "720px",
        results: "1120px",
      },
      keyframes: {
        "fade-rise": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-rise": "fade-rise 180ms ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
