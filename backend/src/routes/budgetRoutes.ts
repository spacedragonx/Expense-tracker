import { Router } from "express";
import { body } from "express-validator";
import { getBudget, upsertBudget, deleteBudget } from "../controllers/budgetController";
import { protect } from "../middleware/authMiddleware";
import { validate } from "../middleware/validate";

const router = Router();
router.use(protect);

router.get("/:year/:month", getBudget);
router.post(
  "/",
  [body("month").isInt({ min: 1, max: 12 }), body("year").isInt({ min: 2000 }), body("totalLimit").isFloat({ min: 0 })],
  validate,
  upsertBudget
);
router.delete("/:id", deleteBudget);

export default router;
