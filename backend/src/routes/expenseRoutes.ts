import { Router } from "express";
import { body } from "express-validator";
import {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  duplicateExpense,
} from "../controllers/expenseController";
import { protect } from "../middleware/authMiddleware";
import { validate } from "../middleware/validate";

const router = Router();
router.use(protect);

const expenseValidation = [
  body("title").trim().notEmpty(),
  body("amount").isFloat({ gt: 0 }),
  body("category").isMongoId(),
  body("date").optional().isISO8601(),
];

router.get("/", getExpenses);
router.get("/:id", getExpenseById);
router.post("/", expenseValidation, validate, createExpense);
router.put("/:id", updateExpense);
router.delete("/:id", deleteExpense);
router.post("/:id/duplicate", duplicateExpense);

export default router;
