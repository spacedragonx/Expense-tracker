/**
 * Regression tests for category colour assignment during POST /api/statements/commit.
 *
 * Models are replaced with an in-memory store, so these need no MongoDB. They cover
 * what changed: each distinct category is resolved once, sequentially, and a new
 * category never reuses a colour the user (or a system default) already has while
 * free palette colours remain.
 */
import request from "supertest";
import express from "express";
import { AUTO_CATEGORY_PALETTE, colorForCategoryName } from "../utils/categoryColor";

const mockCats: any[] = [];
jest.mock("../models/Category", () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(async (q: any) =>
      mockCats.find((c) => q.name.$regex.test(c.name) && c.kind === q.kind && String(c.user) === String(q.user)) ?? null
    ),
    find: jest.fn((q: any) => ({
      select: () => ({
        lean: async () =>
          mockCats.filter((c) => c.kind === q.kind && q.$or.some((o: any) => String(c.user) === String(o.user))),
      }),
    })),
    create: jest.fn(async (doc: any) => {
      const c = { ...doc, _id: { toString: () => `id${mockCats.length}` } };
      mockCats.push(c);
      return c;
    }),
  },
}));
jest.mock("../models/Expense", () => ({
  __esModule: true,
  default: {
    computeHash: jest.fn(() => `h${Math.random()}`),
    find: jest.fn(() => ({ select: async () => [] })),
    insertMany: jest.fn(async (d: any[]) => d),
  },
}));
jest.mock("../models/Income", () => ({
  __esModule: true,
  default: { find: jest.fn(() => ({ select: async () => [] })), insertMany: jest.fn(async (d: any[]) => d) },
}));
jest.mock("../services/transactionValidator", () => ({
  validateTransactions: (rows: any[]) => ({ valid: rows, rejectedCount: 0 }),
}));
jest.mock("../middleware/authMiddleware", () => ({
  protect: (_req: any, _res: any, next: any) => {
    // The test's app.use already sets req.user, but we bypass the JWT check here.
    next();
  },
}));

import router from "../routes/statementUpload";
import Category from "../models/Category";
import Expense from "../models/Expense";

const app = express()
  .use(express.json())
  .use((req: any, _res, next) => {
    req.user = { _id: { toString: () => "u1" } };
    next();
  })
  .use("/api", router);

/** Two expense rows per category name. */
const commit = (names: string[]) =>
  request(app)
    .post("/api/commit")
    .send({
      transactions: names.flatMap((category, i) =>
        [0, 1].map((k) => ({
          date: "2024-03-01",
          description: `${category} ${i}-${k}`,
          amount: 100,
          type: "expense",
          category,
        }))
      ),
    });

/** n names that all hash to the same preferred palette slot — the worst case for hash-only assignment. */
const collidingNames = (n: number) => {
  const target = colorForCategoryName("x");
  const out: string[] = [];
  for (let i = 0; out.length < n; i++) if (colorForCategoryName(`c${i}`) === target) out.push(`c${i}`);
  return out;
};
const created = () => mockCats.filter((c) => c.user === "u1");

beforeEach(() => {
  mockCats.length = 0;
  jest.clearAllMocks();
});

describe("POST /commit category colours", () => {
  it("new categories avoid the system defaults' colours and each other, even when their names collide", async () => {
    AUTO_CATEGORY_PALETTE.slice(0, 7).forEach((color, i) =>
      mockCats.push({ user: null, name: `Default ${i}`, kind: "expense", color })
    );
    const res = await commit(collidingNames(3));
    expect(res.status).toBe(201);
    expect(created()).toHaveLength(3);
    // exactly the 3 palette colours nobody has used yet
    expect(new Set(created().map((c) => c.color))).toEqual(new Set(AUTO_CATEGORY_PALETTE.slice(7)));
  });

  it("spreads colours evenly once there are more categories than palette colours", async () => {
    const res = await commit(collidingNames(23));
    expect(res.status).toBe(201);
    const counts = new Map<string, number>();
    created().forEach((c) => counts.set(c.color, (counts.get(c.color) ?? 0) + 1));
    expect(counts.size).toBe(AUTO_CATEGORY_PALETTE.length);
    expect(Math.max(...counts.values()) - Math.min(...counts.values())).toBeLessThanOrEqual(1);
  });

  it("resolves each distinct category once (case-insensitively) and still inserts every row", async () => {
    const res = await commit(["Groceries", "groceries", "Fuel"]);
    expect(res.status).toBe(201);
    expect(Category.create).toHaveBeenCalledTimes(2);
    const inserted = (Expense.insertMany as jest.Mock).mock.calls[0][0];
    expect(inserted).toHaveLength(6);
    expect(inserted.every((d: any) => typeof d.category === "string" && d.category.startsWith("id"))).toBe(true);
    expect(res.body.data.savedExpenseCount).toBe(6);
  });

  it("reuses an existing user category instead of creating one", async () => {
    mockCats.push({
      user: "u1",
      name: "Groceries",
      kind: "expense",
      color: AUTO_CATEGORY_PALETTE[0],
      _id: { toString: () => "existing" },
    });
    await commit(["Groceries"]);
    expect(Category.create).not.toHaveBeenCalled();
    expect((Expense.insertMany as jest.Mock).mock.calls[0][0].every((d: any) => d.category === "existing")).toBe(true);
  });
});
