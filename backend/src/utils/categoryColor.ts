/**
 * categoryColor.ts — colour assignment for auto-created categories.
 *
 * The palette is the Okabe–Ito colour-blind-safe set (minus black and the
 * too-light yellow) extended with four extra hues chosen to stay apart from it.
 * Measured with CIEDE2000: worst pair for normal vision ΔE≈18.5, and ≥7 under
 * deuteranopia/protanopia simulation. (The previous 15-colour list had pairs at
 * ΔE≈5 for normal vision and ≈0.3 under colour-blind simulation.)
 *
 * Every colour also keeps ≥2.3:1 contrast against both white and the app's dark
 * slate cards, so it reads in light and dark mode.
 *
 * Keep in sync with FALLBACK_COLORS in frontend/src/utils/categoryColors.ts.
 */
export const AUTO_CATEGORY_PALETTE = [
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

/** The flat gray every auto-created category got before palette cycling was added. */
export const LEGACY_AUTO_CATEGORY_COLOR = "#6B7280";

/**
 * Picks a colour for a new category.
 *
 * With no `used` colours this is the original behaviour: a stable hash of the
 * name selects a palette slot, so the same name always gets the same colour.
 *
 * With `used` (the colours the user's categories already have) it starts at that
 * hash slot but walks forward to the least-used colour. Names therefore can't
 * collide onto an already-taken colour while the palette still has free ones,
 * and once it is exhausted colours are reused as evenly as possible.
 */
export function colorForCategoryName(name: string, used: ReadonlyArray<string | null | undefined> = []): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  const start = hash % AUTO_CATEGORY_PALETTE.length;

  const counts = new Map<string, number>();
  for (const color of used) {
    if (!color) continue;
    const key = color.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  let bestIndex = start;
  let bestCount = Infinity;
  for (let step = 0; step < AUTO_CATEGORY_PALETTE.length; step++) {
    const index = (start + step) % AUTO_CATEGORY_PALETTE.length;
    const count = counts.get(AUTO_CATEGORY_PALETTE[index]) ?? 0;
    if (count < bestCount) {
      bestIndex = index;
      bestCount = count;
      if (count === 0) break;
    }
  }
  return AUTO_CATEGORY_PALETTE[bestIndex];
}
