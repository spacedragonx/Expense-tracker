import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Theme } from "@/types";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const STORAGE_KEY = "expense-tracker-theme";

function resolveSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(STORAGE_KEY) as Theme) || "system"
  );
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(
    theme === "system" ? resolveSystemTheme() : theme
  );

  useEffect(() => {
    const applied = theme === "system" ? resolveSystemTheme() : theme;
    setResolvedTheme(applied);
    document.documentElement.classList.toggle("dark", applied === "dark");
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      const applied = resolveSystemTheme();
      setResolvedTheme(applied);
      document.documentElement.classList.toggle("dark", applied === "dark");
    };
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme: setThemeState }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
