import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // OAU (Obafemi Awolowo University) brand palette: deep blue and gold.
        brand: {
          50: "#eef5fb",
          100: "#d9e8f4",
          200: "#b8d1e5",
          300: "#8eb2cf",
          400: "#5d8eaf",
          500: "#316b91",
          600: "#075985",
          700: "#064a70",
          800: "#073d5c",
          900: "#082f49",
          950: "#061f30",
        },
        "oau-blue": {
          50: "#eef5fb",
          100: "#d9e8f4",
          300: "#8eb2cf",
          600: "#075985",
          900: "#082f49",
        },
        "oau-gold": {
          300: "#f4d36b",
          400: "#e5b83f",
          500: "#c9971a",
          600: "#a9780f",
          700: "#80590d",
        },
        // Semantic surface tokens
        surface: {
          DEFAULT: "#ffffff",
          muted: "#f8fafc",
          subtle: "#f1f5f9",
          overlay: "#e2e8f0",
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
        sans: ["Inter", "system-ui", "sans-serif"],
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
