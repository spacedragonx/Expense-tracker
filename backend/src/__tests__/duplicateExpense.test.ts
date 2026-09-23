import type { Request, Response } from "express";

const mockLean = jest.fn();
jest.mock("../models/Expense", () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(() => ({ lean: mockLean })),
    create: jest.fn(async (doc: unknown) => ({ ...(doc as object), _id: "new-id" })),
  },
}));

import Expense from "../models/Expense";
import { duplicateExpense } from "../controllers/expenseController";

const run = async (id = "orig") => {
  const req = { params: { id }, user: { _id: "u1" } } as unknown as Request;
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
  const next = jest.fn();
  await duplicateExpense(req, res, next);
  return { res, next };
};

beforeEach(() => jest.clearAllMocks());

describe("duplicateExpense", () => {
  it("does not copy an imported expense's dedupHash or source (a copy is a manual entry)", async () => {
    mockLean.mockResolvedValue({
      _id: "orig",
      createdAt: new Date(),
      updatedAt: new Date(),
      user: "u1",
      title: "Swiggy",
      amount: 250,
      category: "cat1",
      dedupHash: "abc123",
      source: "statement_import",
    });
    const { res } = await run();

    const created = (Expense.create as jest.Mock).mock.calls[0][0];
    expect(created).not.toHaveProperty("dedupHash");
    expect(created).not.toHaveProperty("_id");
    expect(created.source).toBe("manual");
    expect(created.title).toBe("Swiggy (copy)");
    expect(created.amount).toBe(250);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("still duplicates a manual expense that never had a dedupHash", async () => {
    mockLean.mockResolvedValue({ _id: "orig", user: "u1", title: "Tea", amount: 20, category: "c", source: "manual" });
    await run();
    const created = (Expense.create as jest.Mock).mock.calls[0][0];
    expect(created).not.toHaveProperty("dedupHash");
    expect(created.source).toBe("manual");
  });

  it("returns 404 and creates nothing when the expense isn't found", async () => {
    mockLean.mockResolvedValue(null);
    const { res, next } = await run("missing");
    expect(Expense.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: "Expense not found" }));
  });
});
