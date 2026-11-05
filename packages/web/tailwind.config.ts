import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Institutional navy ──────────────────────────────────────────────
        navy: {
          950: "#0a1628",
          900: "#0f1c3a",
          700: "#1a3260",
          500: "#2d5299",
          200: "#c2cedf",
          100: "#dde4ef",
          "050": "#f0f3f8",
        },
        // ── OAU gold accent ─────────────────────────────────────────────────
        gold: {
          700: "#8a6a1a",
          500: "#b8922a",
          400: "#d4a843",
          100: "#faf3e0",
        },
        // ── Warm stone / parchment neutrals ────────────────────────────────
        stone: {
          900: "#2c2824",
          700: "#4a4540",
          500: "#7a7470",
          300: "#c8c3bc",
          200: "#e0dbd3",
          100: "#ede8e0",
          "050": "#f6f2ec",
        },
        // ── Semantic aliases (used by Tailwind utility classes) ─────────────
        ink:     "#0f1c3a",
        canvas:  "#f6f2ec",
        surface: "#ffffff",
        hairline:"#e0dbd3",
        accent:  "#b8922a",
        // ── Legacy brand tokens (kept for backward compat in any missed spots)
        brand: {
          50:  "#f0f3f8",
          100: "#dde4ef",
          200: "#c2cedf",
          300: "#8eaac8",
          400: "#2d5299",
          500: "#2d5299",
          600: "#1a3260",
          700: "#0f1c3a",
          800: "#0a1628",
          900: "#0a1628",
          950: "#060e1f",
        },
        // ── Status ──────────────────────────────────────────────────────────
        success: { DEFAULT: "#1d6c37", bg: "#e6f4ea", border: "#bbf7d0" },
        warning: { DEFAULT: "#7a5c0a", bg: "#fef9e7", border: "#e8d48a" },
        danger:  { DEFAULT: "#991b1b", bg: "#fef2f2", border: "#fecaca" },
      },

      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        sans:    ["'Inter'", "system-ui", "sans-serif"],
        mono:    ["'JetBrains Mono'", "Menlo", "monospace"],
      },

      fontSize: {
        "2xs": ["11px", { lineHeight: "1.4", letterSpacing: "0.03em" }],
        xs:    ["13px", { lineHeight: "1.5" }],
        sm:    ["14px", { lineHeight: "1.5" }],
        base:  ["16px", { lineHeight: "1.6" }],
        lg:    ["18px", { lineHeight: "1.5" }],
        xl:    ["20px", { lineHeight: "1.4" }],
        "2xl": ["24px", { lineHeight: "1.3" }],
        "3xl": ["30px", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        "4xl": ["36px", { lineHeight: "1.15", letterSpacing: "-0.025em" }],
        "5xl": ["48px", { lineHeight: "1.1",  letterSpacing: "-0.03em" }],
      },

      borderRadius: {
        sm:   "8px",
        md:   "12px",
        lg:   "16px",
        xl:   "20px",
        btn:  "6px",
        full: "9999px",
      },

      boxShadow: {
        card:   "0 1px 4px 0 rgb(15 28 58 / 0.06), 0 1px 2px -1px rgb(15 28 58 / 0.04)",
        raise:  "0 4px 16px 0 rgb(15 28 58 / 0.10), 0 2px 4px -1px rgb(15 28 58 / 0.06)",
        modal:  "0 24px 64px -12px rgb(15 28 58 / 0.22)",
        focus:  "0 0 0 3px rgb(184 146 42 / 0.20)",
        inset:  "inset 0 1px 2px 0 rgb(15 28 58 / 0.06)",
      },

      spacing: {
        "4.5": "18px",
        "13":  "52px",
        "15":  "60px",
        "18":  "72px",
        "22":  "88px",
        "26":  "104px",
        "30":  "120px",
      },

      width:  { sidebar: "224px" },
      height: { topbar:  "60px"  },

      transitionTimingFunction: {
        ease: "cubic-bezier(0.22, 1, 0.36, 1)",
      },

      screens: {
        sm:  "640px",
        md:  "768px",
        lg:  "1024px",
        xl:  "1280px",
        "2xl": "1536px",
      },
    },
  },
  plugins: [],
};

export default config;
