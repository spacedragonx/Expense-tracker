import jwt, { SignOptions } from "jsonwebtoken";
import { Response } from "express";
import { Types } from "mongoose";

/**
 * Signs a JWT for the given user id and sets it as an httpOnly cookie.
 * httpOnly + sameSite cookies avoid exposing the token to client-side JS (XSS-safer
 * than storing the token in localStorage).
 */
export const generateToken = (res: Response, userId: Types.ObjectId | string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not defined in the environment (.env)");

  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"],
  };

  const token = jwt.sign({ userId: userId.toString() }, secret, options);

  const isProduction = process.env.NODE_ENV === "production";

  res.cookie(process.env.JWT_COOKIE_NAME || "expense_tracker_token", token, {
    httpOnly: true,
    secure: isProduction,
    // "strict" only works when frontend and backend share an origin. Render (and
    // similar PaaS split deploys) puts them on different subdomains, making this a
    // cross-site request — SameSite=None (+ Secure, required alongside it) is what
    // lets the cookie survive that. Requires HTTPS, so it's prod-only.
    sameSite: isProduction ? "none" : "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return token;
};

export default generateToken;
