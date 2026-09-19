import * as Icons from "lucide-react";
import { Receipt, Wallet, type LucideIcon } from "lucide-react";
import type { Category } from "@/types";

/** "heart-pulse" -> "HeartPulse" to match lucide-react's PascalCase export names. */
function kebabToPascal(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

/**
 * Resolves a category's stored icon name (e.g. "utensils", "heart-pulse", as
 * seeded in seedDefaultExpenseCategories.ts) to an actual lucide-react
 * component. Falls back gracefully so an unrecognized/missing icon name
 * never breaks rendering.
 */
export function resolveCategoryIcon(iconName: string | undefined, kind: "expense" | "income" = "expense"): LucideIcon {
  if (iconName) {
    const pascal = kebabToPascal(iconName);
    const found = (Icons as unknown as Record<string, LucideIcon>)[pascal];
    if (found) return found;
  }
  return kind === "income" ? Wallet : Receipt;
}

/** Deterministic fallback color (keeps icon chips consistent even without a stored category.color). */
const FALLBACK_PALETTE = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4", "#64748b"];

export function resolveCategoryColor(color: string | undefined, seed: string): string {
  if (color) return color;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return FALLBACK_PALETTE[hash % FALLBACK_PALETTE.length];
}

export function getCategoryFromField(category: Category | string | undefined): Category | null {
  if (!category || typeof category === "string") return null;
  return category;
}
