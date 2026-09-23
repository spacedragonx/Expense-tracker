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
        // Legacy colors (mainly preserved for dark mode)
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
        // New editorial palette (Light Mode)
        ivory: "#EBE6DD",
        fog: "#F5F5F5",
        ash: "#EFEFEF",
        graphite: "#202020",
        ember: "#FF682C",
        brass: "#816729",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        soft: "0 2px 12px 0 rgb(0 0 0 / 0.06)",
        lift: "0 8px 24px -8px rgb(0 0 0 / 0.18)",
        // New minimal shadow for editorial look
        editorial: "0 1px 3px 0 rgb(0 0 0 / 0.05)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s infinite",
        "fade-in-up": "fade-in-up 0.35s ease-out both",
        "scale-in": "scale-in 0.18s ease-out both",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
