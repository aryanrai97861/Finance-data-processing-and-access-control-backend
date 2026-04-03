import { Router } from "express";
import { authController } from "./auth.controller";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { z } from "zod";
import rateLimit from "express-rate-limit";

const router = Router();

// Rate limiter for auth routes: 10 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation schemas
const registerSchema = {
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be at most 100 characters"),
  }),
};

const loginSchema = {
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
};

/**
 * POST /api/auth/register
 * Register a new user (rate limited)
 */
router.post("/register", authLimiter, validate(registerSchema), authController.register);

/**
 * POST /api/auth/login
 * Login with email & password (rate limited)
 */
router.post("/login", authLimiter, validate(loginSchema), authController.login);

/**
 * GET /api/auth/me
 * Get current user profile (requires authentication)
 */
router.get("/me", authenticate, authController.getProfile);

export default router;
