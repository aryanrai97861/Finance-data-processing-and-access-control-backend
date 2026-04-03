import { Router } from "express";
import { userController } from "./user.controller";
import { authenticate } from "../../middleware/auth";
import { authorize } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import { z } from "zod";

const router = Router();

// All user routes require authentication + ADMIN role
router.use(authenticate, authorize("ADMIN"));

// Validation schemas
const updateUserSchema = {
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    role: z.enum(["VIEWER", "ANALYST", "ADMIN"]).optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field (name, role, or status) must be provided",
  }),
};

const listUsersSchema = {
  query: z.object({
    page: z.string().regex(/^\d+$/, "Page must be a number").optional(),
    limit: z.string().regex(/^\d+$/, "Limit must be a number").optional(),
    search: z.string().optional(),
  }),
};

const idParamSchema = {
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
};

/**
 * GET /api/users
 * List all users (paginated, searchable) — ADMIN only
 */
router.get("/", validate(listUsersSchema), userController.listUsers);

/**
 * GET /api/users/:id
 * Get user by ID — ADMIN only
 */
router.get("/:id", validate(idParamSchema), userController.getUserById);

/**
 * PATCH /api/users/:id
 * Update user (name, role, status) — ADMIN only
 */
router.patch("/:id", validate({ ...idParamSchema, ...updateUserSchema }), userController.updateUser);

/**
 * DELETE /api/users/:id
 * Delete user — ADMIN only
 */
router.delete("/:id", validate(idParamSchema), userController.deleteUser);

export default router;
