import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // OAU (Obafemi Awolowo University) institutional palette.
        brand: {
          50: "#E8EFF7",
          100: "#DCE8F4",
          200: "#BFCEE2",
          300: "#8EAAC8",
          400: "#527EAE",
          500: "#255899",
          600: "#10386B",
          700: "#0C2D58",
          800: "#071936",
          900: "#071936",
          950: "#040E21",
        },
        "oau-blue": {
          50: "#E8EFF7",
          100: "#DCE8F4",
          300: "#8EAAC8",
          600: "#10386B",
          900: "#071936",
        },
        "oau-gold": {
          100: "#FEF9E7",
          300: "#F5B82E",
          400: "#F5B82E",
          500: "#D4AF37",
          600: "#785C12",
          700: "#785C12",
        },
        "oau-terracotta": {
          500: "#E1635C",
        },
        // Semantic surface tokens
        surface: {
          DEFAULT: "#ffffff",
          muted: "#F8FAFC",
          subtle: "#F1F5F9",
          overlay: "#E2E8F0",
        },
        // Architectural neutral scale used by the existing slate utilities.
        slate: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
          950: "#020617",
        },
        // OAU Batch/Year colors (secondary palette)
        batch: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#eab308",
          700: "#ca8a04",
          800: "#a16207",
          900: "#854d0e",
        },
      },
      borderRadius: {
        sm: "0.25rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
      },
      fontFamily: {
        sans: ["Aptos", "Segoe UI", "sans-serif"],
        serif: ["Georgia", "Cambria", "serif"],
        mono: ["JetBrains Mono", "Menlo", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
        "card-hover": "0 4px 12px 0 rgb(0 0 0 / 0.08)",
        modal: "0 20px 60px -10px rgb(0 0 0 / 0.2)",
        "batch-glow": "0 0 0 1px rgba(251, 191, 36, 0.15)",
      },
      // Batch/decade stripe pattern CSS variable
      backgroundImage: {
        "batch-stripe":
          "conic-gradient(from 45deg, #1a5af5, #1344e1, #1638b6, #17338f, #1a5af5)",
      },
    },
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
  },
  plugins: [
    // Add batch stripe plugin
    function ({ addUtilities }) {
      const batchStripe = {
        ".batch-stripe": {
          "background-image": "var(--batch-stripe)",
          "background-size": "300% 300%",
          animation: "batch-rotate 8s linear infinite",
        },
      };
      addUtilities(batchStripe, ["responsive"]);
    },
  ],
};

export default config;
