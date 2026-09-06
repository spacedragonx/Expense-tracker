import { Router } from "express";
import { getDashboardSummary, getSpendingByCategory, getMonthlyTrend } from "../controllers/dashboardController";
import { protect } from "../middleware/authMiddleware";

const router = Router();
router.use(protect);

router.get("/summary", getDashboardSummary);
router.get("/spending-by-category", getSpendingByCategory);
router.get("/trend", getMonthlyTrend);

export default router;
