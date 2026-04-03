import { Request, Response, NextFunction } from "express";
import { dashboardService } from "./dashboard.service";
import { sendResponse } from "../../utils/apiResponse";

export class DashboardController {
  async getSummary(_req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await dashboardService.getSummary();

      sendResponse({
        res,
        message: "Dashboard summary retrieved successfully",
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryTotals(_req: Request, res: Response, next: NextFunction) {
    try {
      const totals = await dashboardService.getCategoryTotals();

      sendResponse({
        res,
        message: "Category totals retrieved successfully",
        data: totals,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTrends(_req: Request, res: Response, next: NextFunction) {
    try {
      const trends = await dashboardService.getTrends();

      sendResponse({
        res,
        message: "Monthly trends retrieved successfully",
        data: trends,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecentActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const records = await dashboardService.getRecentActivity(limit);

      sendResponse({
        res,
        message: "Recent activity retrieved successfully",
        data: records,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
