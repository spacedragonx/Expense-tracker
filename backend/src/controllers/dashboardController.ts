import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { Types } from "mongoose";
import Expense from "../models/Expense";
import Income from "../models/Income";

// @route  GET /api/dashboard/summary
// Returns total balance, this month's income/expenses/savings, and recent transactions.
export const getDashboardSummary = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id as Types.ObjectId;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [monthlyExpenseAgg, monthlyIncomeAgg, allTimeExpenseAgg, allTimeIncomeAgg, recentExpenses, recentIncome] =
    await Promise.all([
      Expense.aggregate([
        { $match: { user: userId, date: { $gte: monthStart, $lt: monthEnd } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Income.aggregate([
        { $match: { user: userId, date: { $gte: monthStart, $lt: monthEnd } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Expense.aggregate([{ $match: { user: userId } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      Income.aggregate([{ $match: { user: userId } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      Expense.find({ user: userId }).sort({ date: -1 }).limit(5).populate("category", "name icon color"),
      Income.find({ user: userId }).sort({ date: -1 }).limit(5),
    ]);

  const monthlyExpenses = monthlyExpenseAgg[0]?.total || 0;
  const monthlyIncome = monthlyIncomeAgg[0]?.total || 0;
  const totalExpenses = allTimeExpenseAgg[0]?.total || 0;
  const totalIncome = allTimeIncomeAgg[0]?.total || 0;

  const recentTransactions = [
    ...recentExpenses.map((e) => ({ ...e.toObject(), type: "expense" as const })),
    ...recentIncome.map((i) => ({ ...i.toObject(), type: "income" as const })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  res.json({
    success: true,
    data: {
      totalBalance: totalIncome - totalExpenses,
      monthlyIncome,
      monthlyExpenses,
      monthlySavings: monthlyIncome - monthlyExpenses,
      recentTransactions,
    },
  });
});

// @route  GET /api/dashboard/spending-by-category?from=&to=
export const getSpendingByCategory = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id as Types.ObjectId;
  const { from, to } = req.query;

  const match: Record<string, unknown> = { user: userId };
  if (from || to) {
    match.date = {
      ...(from ? { $gte: new Date(from as string) } : {}),
      ...(to ? { $lte: new Date(to as string) } : {}),
    };
  }

  const breakdown = await Expense.aggregate([
    { $match: match },
    { $group: { _id: "$category", total: { $sum: "$amount" } } },
    { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
    { $unwind: "$category" },
    { $project: { _id: 0, category: "$category.name", color: "$category.color", total: 1 } },
    { $sort: { total: -1 } },
  ]);

  res.json({ success: true, data: breakdown });
});

// @route  GET /api/dashboard/trend?months=6
// A single calendar month only has one monthly bucket, which makes for a
// flat, meaningless "trend" line, so months=1 switches to day-level
// grouping within the current month instead.
export const getMonthlyTrend = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id as Types.ObjectId;
  const months = Math.min(24, Number(req.query.months) || 6);

  if (months === 1) {
    const qMonth = req.query.month ? Number(req.query.month) : null;
    const qYear = req.query.year ? Number(req.query.year) : null;
    
    let start = new Date();
    let end = new Date();
    if (qMonth && qYear) {
      start = new Date(qYear, qMonth - 1, 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(qYear, qMonth, 1);
      end.setHours(0, 0, 0, 0);
    } else {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    }

    const groupStage = {
      $group: { _id: { y: { $year: "$date" }, m: { $month: "$date" }, d: { $dayOfMonth: "$date" } }, total: { $sum: "$amount" } },
    };

    const matchStage = qMonth && qYear
      ? { $match: { user: userId, date: { $gte: start, $lt: end } } }
      : { $match: { user: userId, date: { $gte: start } } };

    const [expenseTrend, incomeTrend] = await Promise.all([
      Expense.aggregate([matchStage, groupStage, { $sort: { _id: 1 } }]),
      Income.aggregate([matchStage, groupStage, { $sort: { _id: 1 } }]),
    ]);

    res.json({ success: true, data: { expenseTrend, incomeTrend, granularity: "daily" } });
    return;
  }

  const start = new Date();
  start.setMonth(start.getMonth() - (months - 1), 1);
  start.setHours(0, 0, 0, 0);

  const groupStage = { $group: { _id: { y: { $year: "$date" }, m: { $month: "$date" } }, total: { $sum: "$amount" } } };

  const [expenseTrend, incomeTrend] = await Promise.all([
    Expense.aggregate([{ $match: { user: userId, date: { $gte: start } } }, groupStage, { $sort: { _id: 1 } }]),
    Income.aggregate([{ $match: { user: userId, date: { $gte: start } } }, groupStage, { $sort: { _id: 1 } }]),
  ]);

  res.json({ success: true, data: { expenseTrend, incomeTrend, granularity: "monthly" } });
});
