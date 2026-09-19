/**
 * categoryColor.ts — deterministic color assignment for auto-created categories.
 *
 * Cycles a fixed palette by a stable hash of the category name, so the same
 * name always lands on the same color (both across separate imports for one
 * user, and if this function is ever re-run as a migration).
 */

export const AUTO_CATEGORY_PALETTE = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#84cc16",
  "#ec4899",
  "#e11d48",
  "#0891b2",
  "#d97706",
  "#16a34a",
  "#7c3aed",
  "#db2777",
];

/** The flat gray every auto-created category got before palette cycling was added. */
export const LEGACY_AUTO_CATEGORY_COLOR = "#6B7280";

export function colorForCategoryName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AUTO_CATEGORY_PALETTE[hash % AUTO_CATEGORY_PALETTE.length];
}
