import { Router } from "express";
import { body } from "express-validator";
import { getGoals, createGoal, updateGoal, deleteGoal, contributeToGoal } from "../controllers/goalController";
import { protect } from "../middleware/authMiddleware";
import { validate } from "../middleware/validate";

const router = Router();
router.use(protect);

router.get("/", getGoals);
router.post(
  "/",
  [body("title").trim().notEmpty(), body("targetAmount").isFloat({ gt: 0 })],
  validate,
  createGoal
);
router.put("/:id", updateGoal);
router.post("/:id/contribute", [body("amount").isFloat({ gt: 0 })], validate, contributeToGoal);
router.delete("/:id", deleteGoal);

export default router;
