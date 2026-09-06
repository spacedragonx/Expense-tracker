import { Router } from "express";
import { body } from "express-validator";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../controllers/categoryController";
import { protect } from "../middleware/authMiddleware";
import { validate } from "../middleware/validate";

const router = Router();
router.use(protect);

router.get("/", getCategories);
router.post(
  "/",
  [body("name").trim().notEmpty(), body("kind").isIn(["expense", "income"])],
  validate,
  createCategory
);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

export default router;
