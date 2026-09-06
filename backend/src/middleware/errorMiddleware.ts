import { Request, Response, NextFunction } from "express";

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  res.status(404);
  next(new Error(`Route not found - ${req.originalUrl}`));
};

/**
 * Centralized error handler. Every controller should throw/pass errors here
 * (via asyncHandler or next(err)) instead of formatting error JSON inline.
 */
export const errorHandler = (
  err: Error & { statusCode?: number },
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  const statusCode = res.statusCode !== 200 ? res.statusCode : err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Server error",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};
