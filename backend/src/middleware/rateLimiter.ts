import rateLimit from "express-rate-limit";

/**
 * General API rate limiter, applied globally.
 */
export const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." },
});

/**
 * Stricter limiter for auth endpoints (login/register/forgot-password) to slow
 * down credential-stuffing and brute-force attempts.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many auth attempts, please try again later." },
});
