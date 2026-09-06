import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Category from "../models/Category";

// @route  GET /api/categories?kind=expense|income
// Returns the user's custom categories plus the system default categories.
export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const { kind } = req.query;
  const filter: Record<string, unknown> = { $or: [{ user: req.user!._id }, { user: null }] };
  if (kind) filter.kind = kind;

  const categories = await Category.find(filter).sort({ isDefault: -1, name: 1 });
  res.json({ success: true, data: categories });
});

// @route  POST /api/categories
export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, kind, icon, color } = req.body;
  const category = await Category.create({ user: req.user!._id, name, kind, icon, color, isDefault: false });
  res.status(201).json({ success: true, data: category });
});

// @route  PUT /api/categories/:id
export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findOneAndUpdate(
    { _id: req.params.id, user: req.user!._id, isDefault: false },
    req.body,
    { new: true, runValidators: true }
  );
  if (!category) {
    res.status(404);
    throw new Error("Category not found or not editable");
  }
  res.json({ success: true, data: category });
});

// @route  DELETE /api/categories/:id
export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findOneAndDelete({
    _id: req.params.id,
    user: req.user!._id,
    isDefault: false,
  });
  if (!category) {
    res.status(404);
    throw new Error("Category not found or not deletable");
  }
  res.json({ success: true, message: "Category deleted" });
});
