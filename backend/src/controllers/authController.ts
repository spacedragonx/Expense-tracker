import { Request, Response } from "express";
import crypto from "crypto";
import asyncHandler from "express-async-handler";
import User from "../models/User";
import generateToken from "../utils/generateToken";

// @route  POST /api/auth/register
export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(400);
    throw new Error("An account with this email already exists");
  }

  const user = await User.create({ name, email, password });
  generateToken(res, user._id);

  res.status(201).json({
    success: true,
    data: { id: user._id, name: user.name, email: user.email, currency: user.currency },
  });
});

// @route  POST /api/auth/login
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  generateToken(res, user._id);

  res.json({
    success: true,
    data: { id: user._id, name: user.name, email: user.email, currency: user.currency },
  });
});

// @route  POST /api/auth/logout
export const logoutUser = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie(process.env.JWT_COOKIE_NAME || "expense_tracker_token");
  res.json({ success: true, message: "Logged out" });
});

// @route  GET /api/auth/me
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: req.user });
});

// @route  PUT /api/auth/me
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { name, avatarUrl, currency, theme } = req.body;
  const user = await User.findById(req.user!._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (name !== undefined) user.name = name;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
  if (currency !== undefined) user.currency = currency;
  if (theme !== undefined) user.theme = theme;

  await user.save();
  res.json({ success: true, data: user });
});

// @route  PUT /api/auth/change-password
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user!._id).select("+password");
  if (!user || !(await user.comparePassword(currentPassword))) {
    res.status(401);
    throw new Error("Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: "Password updated" });
});

// @route  POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond the same way whether or not the user exists, so this
  // endpoint can't be used to enumerate registered email addresses.
  if (user) {
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 min
    await user.save();

    // TODO: send `resetToken` to the user via email (e.g. nodemailer / SES).
    // Never return the raw token in the API response in production.
  }

  res.json({ success: true, message: "If that email is registered, a reset link has been sent" });
});

// @route  POST /api/auth/reset-password/:token
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    res.status(400);
    throw new Error("Reset token is invalid or has expired");
  }

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json({ success: true, message: "Password reset successful" });
});
