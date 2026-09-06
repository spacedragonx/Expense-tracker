import { Router } from "express";
import { body } from "express-validator";
import {
  getIncomes,
  getIncomeById,
  createIncome,
  updateIncome,
  deleteIncome,
} from "../controllers/incomeController";
import { protect } from "../middleware/authMiddleware";
import { validate } from "../middleware/validate";

const router = Router();
router.use(protect);

const incomeValidation = [
  body("title").trim().notEmpty(),
  body("amount").isFloat({ gt: 0 }),
  body("source").isIn(["salary", "freelance", "investments", "business", "other"]),
];

router.get("/", getIncomes);
router.get("/:id", getIncomeById);
router.post("/", incomeValidation, validate, createIncome);
router.put("/:id", updateIncome);
router.delete("/:id", deleteIncome);

export default router;
