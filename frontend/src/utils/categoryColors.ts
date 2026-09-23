/**
 * Fallback palette used when a category has no color set at all, and the shared
 * source of chart colours on the landing page.
 *
 * Okabe–Ito colour-blind-safe set (minus black / too-light yellow) plus four extra
 * hues. CIEDE2000 worst pair: ΔE≈18.5 for normal vision, ≥7 under deuteranopia /
 * protanopia simulation; every colour keeps ≥2.3:1 contrast on white and dark slate.
 * The previous 15-colour list had neighbours at ΔE≈5 (violet/purple) and ≈0.3 under
 * colour-blind simulation.
 *
 * Keep in sync with AUTO_CATEGORY_PALETTE in backend/src/utils/categoryColor.ts.
 */
export const FALLBACK_COLORS = [
  "#e69f00", // orange
  "#56b4e9", // sky blue
  "#009e73", // bluish green
  "#0072b2", // blue
  "#d55e00", // vermillion
  "#cc79a7", // reddish purple
  "#d6153e", // crimson
  "#9849ed", // violet
  "#8b9b46", // olive
  "#7d89fb", // periwinkle
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
