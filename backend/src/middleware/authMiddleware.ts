import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User";

interface JwtPayload {
  userId: string;
}

/**
 * Verifies the JWT (cookie first, then Authorization header) and attaches
 * the authenticated user to req.user. Every protected route depends on this.
 */
export const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const cookieName = process.env.JWT_COOKIE_NAME || "expense_tracker_token";
  let token = req.cookies?.[cookieName];

  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(401);
      throw new Error("Not authorized, user not found");
    }

    req.user = user;
    next();
  } catch {
    res.status(401);
    throw new Error("Not authorized, token invalid or expired");
  }
});

export default protect;
