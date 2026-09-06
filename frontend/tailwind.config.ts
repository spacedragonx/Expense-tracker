import type { Config } from "tailwindcss";

// Minimalist fintech palette: emerald primary, blue secondary, muted
// neutrals. Kept intentionally restrained per project design guidelines
// (no neon/cluttered accents).
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#ecfdf5",
          100: "#d1fae5",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
        },
        secondary: {
          500: "#3b82f6",
          600: "#2563eb",
        },
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
        surface: {
          light: "#ffffff",
          dark: "#0f172a",
        },
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        soft: "0 2px 12px 0 rgb(0 0 0 / 0.06)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
