import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Income from "../models/Income";

// @route  GET /api/income
export const getIncomes = asyncHandler(async (req: Request, res: Response) => {
  const { page = "1", limit = "20", source, from, to, sort = "-date" } = req.query;

  const filter: Record<string, unknown> = { user: req.user!._id };
  if (source) filter.source = source;
  if (from || to) {
    filter.date = {
      ...(from ? { $gte: new Date(from as string) } : {}),
      ...(to ? { $lte: new Date(to as string) } : {}),
    };
  }

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));

  const [items, total] = await Promise.all([
    Income.find(filter)
      .sort(sort as string)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Income.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

// @route  GET /api/income/:id
export const getIncomeById = asyncHandler(async (req: Request, res: Response) => {
  const income = await Income.findOne({ _id: req.params.id, user: req.user!._id });
  if (!income) {
    res.status(404);
    throw new Error("Income not found");
  }
  res.json({ success: true, data: income });
});

// @route  POST /api/income
export const createIncome = asyncHandler(async (req: Request, res: Response) => {
  const income = await Income.create({ ...req.body, user: req.user!._id });
  res.status(201).json({ success: true, data: income });
});

// @route  PUT /api/income/:id
export const updateIncome = asyncHandler(async (req: Request, res: Response) => {
  const income = await Income.findOneAndUpdate({ _id: req.params.id, user: req.user!._id }, req.body, {
    new: true,
    runValidators: true,
  });
  if (!income) {
    res.status(404);
    throw new Error("Income not found");
  }
  res.json({ success: true, data: income });
});

// @route  DELETE /api/income/:id
export const deleteIncome = asyncHandler(async (req: Request, res: Response) => {
  const income = await Income.findOneAndDelete({ _id: req.params.id, user: req.user!._id });
  if (!income) {
    res.status(404);
    throw new Error("Income not found");
  }
  res.json({ success: true, message: "Income deleted" });
});
