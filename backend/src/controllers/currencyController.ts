import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import User from "../models/User";
import Expense from "../models/Expense";
import Income from "../models/Income";
import Budget from "../models/Budget";
import Goal from "../models/Goal";
import { getExchangeRate, SUPPORTED_CURRENCIES, SupportedCurrency } from "../utils/currency";

// @route  PUT /api/auth/currency
// Switches the signed-in user's currency and converts every stored amount
// (expenses, income, budgets, goals) from their current currency to the new
// one using a live exchange rate, so historical data stays meaningful
// instead of just relabeling numbers.
export const changeCurrency = asyncHandler(async (req: Request, res: Response) => {
  const { currency } = req.body as { currency?: string };

  if (!currency || !SUPPORTED_CURRENCIES.includes(currency as SupportedCurrency)) {
    res.status(400);
    throw new Error(`Currency must be one of: ${SUPPORTED_CURRENCIES.join(", ")}`);
  }

  const target = currency as SupportedCurrency;
  const user = await User.findById(req.user!._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const from = (user.currency && SUPPORTED_CURRENCIES.includes(user.currency as SupportedCurrency)
    ? user.currency
    : "INR") as SupportedCurrency;

  // Already on the target currency — nothing to convert.
  if (from === target) {
    res.json({ success: true, data: user, rate: 1, from, to: target, converted: false });
    return;
  }

  const rate = await getExchangeRate(from, target);
  const userId = user._id;

  // $mul multiplies the field in place, server-side, without pulling every
  // document into app memory — much cheaper than a read-modify-write loop
  // for accounts with a lot of history.
  const [expenseResult, incomeResult, budgetResult, goalResult] = await Promise.all([
    Expense.updateMany({ user: userId }, { $mul: { amount: rate }, $set: { currency: target } }),
    Income.updateMany({ user: userId }, { $mul: { amount: rate }, $set: { currency: target } }),
    Budget.updateMany(
      { user: userId },
      { $mul: { totalLimit: rate, "categoryLimits.$[].limit": rate } }
    ),
    Goal.updateMany({ user: userId }, { $mul: { targetAmount: rate, currentAmount: rate } }),
  ]);

  user.currency = target;
  await user.save();

  res.json({
    success: true,
    data: user,
    rate,
    from,
    to: target,
    converted: true,
    counts: {
      expenses: expenseResult.modifiedCount,
      income: incomeResult.modifiedCount,
      budgets: budgetResult.modifiedCount,
      goals: goalResult.modifiedCount,
    },
  });
});
