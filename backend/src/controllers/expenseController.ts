import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Expense from "../models/Expense";

// @route  GET /api/expenses
// Supports pagination + filters: ?page=1&limit=20&category=&from=&to=&minAmount=&maxAmount=&search=&sort=-date
export const getExpenses = asyncHandler(async (req: Request, res: Response) => {
  const { page = "1", limit = "20", category, from, to, minAmount, maxAmount, search, sort = "-date" } = req.query;

  const filter: Record<string, unknown> = { user: req.user!._id };
  if (category) filter.category = category;
  if (from || to) {
    filter.date = {
      ...(from ? { $gte: new Date(from as string) } : {}),
      ...(to ? { $lte: new Date(to as string) } : {}),
    };
  }
  if (minAmount || maxAmount) {
    filter.amount = {
      ...(minAmount ? { $gte: Number(minAmount) } : {}),
      ...(maxAmount ? { $lte: Number(maxAmount) } : {}),
    };
  }
  if (search) filter.title = { $regex: search as string, $options: "i" };

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));

  const [items, total] = await Promise.all([
    Expense.find(filter)
      .populate("category", "name icon color")
      .sort(sort as string)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Expense.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

// @route  GET /api/expenses/:id
export const getExpenseById = asyncHandler(async (req: Request, res: Response) => {
  const expense = await Expense.findOne({ _id: req.params.id, user: req.user!._id }).populate(
    "category",
    "name icon color"
  );
  if (!expense) {
    res.status(404);
    throw new Error("Expense not found");
  }
  res.json({ success: true, data: expense });
});

// @route  POST /api/expenses
export const createExpense = asyncHandler(async (req: Request, res: Response) => {
  const expense = await Expense.create({ ...req.body, user: req.user!._id });
  res.status(201).json({ success: true, data: expense });
});

// @route  PUT /api/expenses/:id
export const updateExpense = asyncHandler(async (req: Request, res: Response) => {
  const expense = await Expense.findOneAndUpdate({ _id: req.params.id, user: req.user!._id }, req.body, {
    new: true,
    runValidators: true,
  });
  if (!expense) {
    res.status(404);
    throw new Error("Expense not found");
  }
  res.json({ success: true, data: expense });
});

// @route  DELETE /api/expenses/:id
export const deleteExpense = asyncHandler(async (req: Request, res: Response) => {
  const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user!._id });
  if (!expense) {
    res.status(404);
    throw new Error("Expense not found");
  }
  res.json({ success: true, message: "Expense deleted" });
});

// @route  POST /api/expenses/:id/duplicate
export const duplicateExpense = asyncHandler(async (req: Request, res: Response) => {
  const original = await Expense.findOne({ _id: req.params.id, user: req.user!._id }).lean();
  if (!original) {
    res.status(404);
    throw new Error("Expense not found");
  }
  // A copy is a manual entry: it must not inherit the original's import fingerprint (which is
  // unique per user) or its statement_import source.
  const { _id, createdAt, updatedAt, dedupHash, source, ...rest } = original;
  const copy = await Expense.create({ ...rest, source: "manual", title: `${rest.title} (copy)`, date: new Date() });
  res.status(201).json({ success: true, data: copy });
});
