import { Router } from "express";
import { recordController } from "./record.controller";
import { authenticate } from "../../middleware/auth";
import { authorize } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import { z } from "zod";

const router = Router();

// All record routes require authentication
router.use(authenticate);

// Validation schemas
const createRecordSchema = {
  body: z.object({
    amount: z.number().positive("Amount must be a positive number"),
    type: z.enum(["INCOME", "EXPENSE"], { message: "Type must be INCOME or EXPENSE" }),
    category: z.string().min(1, "Category is required").max(50, "Category must be at most 50 characters"),
    description: z.string().max(500, "Description must be at most 500 characters").optional(),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
  }),
};

const updateRecordSchema = {
  body: z.object({
    amount: z.number().positive("Amount must be a positive number").optional(),
    type: z.enum(["INCOME", "EXPENSE"]).optional(),
    category: z.string().min(1).max(50).optional(),
    description: z.string().max(500).optional().nullable(),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" }).optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  }),
};

const listRecordsSchema = {
  query: z.object({
    type: z.enum(["INCOME", "EXPENSE"]).optional(),
    category: z.string().optional(),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid startDate" }).optional(),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid endDate" }).optional(),
    minAmount: z.string().regex(/^\d+(\.\d+)?$/, "minAmount must be a number").optional(),
    maxAmount: z.string().regex(/^\d+(\.\d+)?$/, "maxAmount must be a number").optional(),
    page: z.string().regex(/^\d+$/, "Page must be a number").optional(),
    limit: z.string().regex(/^\d+$/, "Limit must be a number").optional(),
    sortBy: z.enum(["date", "amount", "category", "type", "createdAt"]).optional(),
    order: z.enum(["asc", "desc"]).optional(),
  }),
};

const idParamSchema = {
  params: z.object({
    id: z.string().min(1, "Record ID is required"),
  }),
};

/**
 * POST /api/records
 * Create a new financial record — ADMIN only
 */
router.post("/", authorize("ADMIN"), validate(createRecordSchema), recordController.createRecord);

/**
 * GET /api/records
 * List records with filters — All authenticated users
 */
router.get("/", validate(listRecordsSchema), recordController.listRecords);

/**
 * GET /api/records/:id
 * Get a single record — All authenticated users
 */
router.get("/:id", validate(idParamSchema), recordController.getRecordById);

/**
 * PATCH /api/records/:id
 * Update a record — ADMIN only
 */
router.patch("/:id", authorize("ADMIN"), validate({ ...idParamSchema, ...updateRecordSchema }), recordController.updateRecord);

/**
 * DELETE /api/records/:id
 * Soft delete a record — ADMIN only
 */
router.delete("/:id", authorize("ADMIN"), validate(idParamSchema), recordController.deleteRecord);

export default router;
