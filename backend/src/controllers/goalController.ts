import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Goal from "../models/Goal";

// @route  GET /api/goals
export const getGoals = asyncHandler(async (req: Request, res: Response) => {
  const goals = await Goal.find({ user: req.user!._id }).sort({ isCompleted: 1, deadline: 1 });
  res.json({ success: true, data: goals });
});

// @route  POST /api/goals
export const createGoal = asyncHandler(async (req: Request, res: Response) => {
  const goal = await Goal.create({ ...req.body, user: req.user!._id });
  res.status(201).json({ success: true, data: goal });
});

// @route  PUT /api/goals/:id
export const updateGoal = asyncHandler(async (req: Request, res: Response) => {
  const goal = await Goal.findOne({ _id: req.params.id, user: req.user!._id });
  if (!goal) {
    res.status(404);
    throw new Error("Goal not found");
  }
  Object.assign(goal, req.body);
  await goal.save(); // triggers pre-save hook to recompute isCompleted
  res.json({ success: true, data: goal });
});

// @route  POST /api/goals/:id/contribute
export const contributeToGoal = asyncHandler(async (req: Request, res: Response) => {
  const { amount } = req.body;
  const goal = await Goal.findOne({ _id: req.params.id, user: req.user!._id });
  if (!goal) {
    res.status(404);
    throw new Error("Goal not found");
  }
  goal.currentAmount += Number(amount);
  await goal.save();
  res.json({ success: true, data: goal });
});

// @route  DELETE /api/goals/:id
export const deleteGoal = asyncHandler(async (req: Request, res: Response) => {
  const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user!._id });
  if (!goal) {
    res.status(404);
    throw new Error("Goal not found");
  }
  res.json({ success: true, message: "Goal deleted" });
});
