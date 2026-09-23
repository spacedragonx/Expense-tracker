import { AUTO_CATEGORY_PALETTE, colorForCategoryName } from "../utils/categoryColor";

describe("AUTO_CATEGORY_PALETTE", () => {
  it("contains only unique, valid lowercase hex colours", () => {
    for (const color of AUTO_CATEGORY_PALETTE) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/);
    }
    expect(new Set(AUTO_CATEGORY_PALETTE).size).toBe(AUTO_CATEGORY_PALETTE.length);
  });
});

describe("colorForCategoryName", () => {
  it("is deterministic and always returns a palette colour", () => {
    const a = colorForCategoryName("Groceries");
    expect(colorForCategoryName("Groceries")).toBe(a);
    expect(AUTO_CATEGORY_PALETTE).toContain(a);
  });

  it("behaves as before when no used colours are supplied", () => {
    expect(colorForCategoryName("Travel", [])).toBe(colorForCategoryName("Travel"));
    expect(colorForCategoryName("Travel", [null, undefined, ""])).toBe(colorForCategoryName("Travel"));
  });

  it("skips a colour the user already has", () => {
    const preferred = colorForCategoryName("Groceries");
    const next = colorForCategoryName("Groceries", [preferred]);
    expect(next).not.toBe(preferred);
    expect(AUTO_CATEGORY_PALETTE).toContain(next);
  });

  it("matches used colours case-insensitively (DB may store #E69F00)", () => {
    const preferred = colorForCategoryName("Rent");
    expect(colorForCategoryName("Rent", [preferred.toUpperCase()])).not.toBe(preferred);
  });

  it("gives every category a distinct colour until the palette is exhausted", () => {
    // Worst case: names that ALL hash to the same preferred slot.
    const names: string[] = [];
    const target = colorForCategoryName("seed-0");
    for (let i = 0; names.length < AUTO_CATEGORY_PALETTE.length; i++) {
      if (colorForCategoryName(`name-${i}`) === target) names.push(`name-${i}`);
    }
    expect(new Set(names.map((n) => colorForCategoryName(n))).size).toBe(1); // they really do collide

    const used: string[] = [];
    for (const name of names) used.push(colorForCategoryName(name, used));
    expect(new Set(used).size).toBe(AUTO_CATEGORY_PALETTE.length);
  });

  it("reuses colours as evenly as possible once the palette is exhausted", () => {
    const n = AUTO_CATEGORY_PALETTE.length;
    const used: string[] = [];
    for (let i = 0; i < n * 2 + 3; i++) used.push(colorForCategoryName(`Cat ${i}`, used));

    const counts = new Map<string, number>();
    used.forEach((c) => counts.set(c, (counts.get(c) ?? 0) + 1));
    const values = [...counts.values()];
    expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(1);
  });

  it("ignores unknown colours in `used` (e.g. a user-picked custom colour)", () => {
    const preferred = colorForCategoryName("Fuel");
    expect(colorForCategoryName("Fuel", ["#123456", "#abcdef"])).toBe(preferred);
  });
});
