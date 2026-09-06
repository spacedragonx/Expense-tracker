import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Budget from "../models/Budget";
import Expense from "../models/Expense";

// @route  GET /api/budgets/:year/:month
export const getBudget = asyncHandler(async (req: Request, res: Response) => {
  const year = Number(req.params.year);
  const month = Number(req.params.month);

  const budget = await Budget.findOne({ user: req.user!._id, year, month }).populate(
    "categoryLimits.category",
    "name icon color"
  );
  if (!budget) {
    res.status(404);
    throw new Error("No budget set for this month");
  }

  // Aggregate actual spend per category for the same month so the response
  // can report used % and remaining budget without a second round trip.
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  const spend = await Expense.aggregate([
    { $match: { user: req.user!._id, date: { $gte: start, $lt: end } } },
    { $group: { _id: "$category", total: { $sum: "$amount" } } },
  ]);
  const spendMap = new Map(spend.map((s) => [String(s._id), s.total]));
  const totalSpent = spend.reduce((sum, s) => sum + s.total, 0);

  res.json({
    success: true,
    data: {
      budget,
      totalSpent,
      totalRemaining: budget.totalLimit - totalSpent,
      usedPercent: budget.totalLimit > 0 ? Math.round((totalSpent / budget.totalLimit) * 100) : 0,
      categoryBreakdown: budget.categoryLimits.map((cl) => ({
        category: cl.category,
        limit: cl.limit,
        spent: spendMap.get(String(cl.category)) || 0,
      })),
    },
  });
});

// @route  POST /api/budgets
export const upsertBudget = asyncHandler(async (req: Request, res: Response) => {
  const { month, year, totalLimit, categoryLimits, alertThresholdPercent } = req.body;

  const budget = await Budget.findOneAndUpdate(
    { user: req.user!._id, month, year },
    { totalLimit, categoryLimits, alertThresholdPercent },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  res.status(200).json({ success: true, data: budget });
});

// @route  DELETE /api/budgets/:id
export const deleteBudget = asyncHandler(async (req: Request, res: Response) => {
  const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user!._id });
  if (!budget) {
    res.status(404);
    throw new Error("Budget not found");
  }
  res.json({ success: true, message: "Budget deleted" });
});
