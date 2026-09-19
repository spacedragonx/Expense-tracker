/**
 * Vivid fallback palette used when a category has no color set at all.
 * These are all deliberately distinct and non-grey so every category looks different.
 */
export const FALLBACK_COLORS = [
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

/**
 * Legacy grey values that were incorrectly assigned to auto-created categories
 * before the palette system was added. We override these on the frontend too,
 * as a safety net for any lingering stale data in the DB.
 */
const LEGACY_GREYS = new Set(["#6b7280", "#94a3b8"]);

/**
 * Returns the display color for a category.
 * - If the API returned a real non-grey color, trust it.
 * - If it's a known legacy grey or missing, derive a stable color from the name (or index).
 */
export function categoryColor(color: string | undefined, index: number, name?: string): string {
  const normalized = color?.toLowerCase();
  if (!normalized || LEGACY_GREYS.has(normalized)) {
    // Derive a stable color from the category name using a hash
    if (name) {
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
    }
    return FALLBACK_COLORS[index % FALLBACK_COLORS.length];
  }
  return color!;
}
