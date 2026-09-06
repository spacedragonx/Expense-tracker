import { Router } from "express";
import { body } from "express-validator";
import {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
} from "../controllers/authController";
import { changeCurrency } from "../controllers/currencyController";
import { protect } from "../middleware/authMiddleware";
import { validate } from "../middleware/validate";
import { authLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post(
  "/register",
  authLimiter,
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  ],
  validate,
  registerUser
);

router.post(
  "/login",
  authLimiter,
  [body("email").isEmail(), body("password").notEmpty()],
  validate,
  loginUser
);

router.post("/logout", logoutUser);

router.post(
  "/forgot-password",
  authLimiter,
  [body("email").isEmail()],
  validate,
  forgotPassword
);

router.post(
  "/reset-password/:token",
  [body("password").isLength({ min: 8 })],
  validate,
  resetPassword
);

router.get("/me", protect, getProfile);
router.put("/me", protect, updateProfile);
router.put(
  "/currency",
  protect,
  [body("currency").isIn(["INR", "EUR", "USD"]).withMessage("Currency must be one of INR, EUR, USD")],
  validate,
  changeCurrency
);
router.put(
  "/change-password",
  protect,
  [body("currentPassword").notEmpty(), body("newPassword").isLength({ min: 8 })],
  validate,
  changePassword
);

export default router;
