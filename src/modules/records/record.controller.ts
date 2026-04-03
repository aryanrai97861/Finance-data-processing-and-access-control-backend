import { Request, Response, NextFunction } from "express";
import { recordService } from "./record.service";
import { sendResponse } from "../../utils/apiResponse";

export class RecordController {
  async createRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const record = await recordService.createRecord({
        ...req.body,
        userId: req.user!.id,
      });

      sendResponse({
        res,
        statusCode: 201,
        message: "Financial record created successfully",
        data: record,
      });
    } catch (error) {
      next(error);
    }
  }

  async listRecords(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        type: req.query.type as any,
        category: req.query.category as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        minAmount: req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined,
        maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        sortBy: req.query.sortBy as string,
        order: (req.query.order as "asc" | "desc") || "desc",
      };

      const result = await recordService.listRecords(filters);

      sendResponse({
        res,
        message: "Financial records retrieved successfully",
        data: result.records,
        meta: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecordById(req: Request, res: Response, next: NextFunction) {
    try {
      const record = await recordService.getRecordById(req.params.id as string);

      sendResponse({
        res,
        message: "Financial record retrieved successfully",
        data: record,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const record = await recordService.updateRecord(req.params.id as string, req.body);

      sendResponse({
        res,
        message: "Financial record updated successfully",
        data: record,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteRecord(req: Request, res: Response, next: NextFunction) {
    try {
      await recordService.deleteRecord(req.params.id as string);

      sendResponse({
        res,
        message: "Financial record deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const recordController = new RecordController();
