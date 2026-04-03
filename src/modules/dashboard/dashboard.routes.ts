import { Router } from "express";
import { dashboardController } from "./dashboard.controller";
import { authenticate } from "../../middleware/auth";
import { authorize } from "../../middleware/rbac";

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

/**
 * GET /api/dashboard/summary
 * Financial summary (totals, net balance) — ANALYST and ADMIN only
 */
router.get("/summary", authorize("ANALYST", "ADMIN"), dashboardController.getSummary);

/**
 * GET /api/dashboard/category-totals
 * Category-wise breakdown — ANALYST and ADMIN only
 */
router.get("/category-totals", authorize("ANALYST", "ADMIN"), dashboardController.getCategoryTotals);

/**
 * GET /api/dashboard/trends
 * Monthly trends (last 12 months) — ANALYST and ADMIN only
 */
router.get("/trends", authorize("ANALYST", "ADMIN"), dashboardController.getTrends);

/**
 * GET /api/dashboard/recent
 * Recent activity (last N records) — All authenticated users
 */
router.get("/recent", dashboardController.getRecentActivity);

export default router;
