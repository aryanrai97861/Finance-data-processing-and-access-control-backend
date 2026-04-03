import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";

/**
 * Global error handler middleware.
 * Catches all errors and returns a consistent JSON response.
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  // Log error in development
  if (process.env.NODE_ENV === "development") {
    console.error("❌ Error:", err.message);
    if (!(err instanceof ApiError)) {
      console.error(err.stack);
    }
  }

  // Handle our custom ApiError
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Handle Prisma errors by checking error name/code
  const prismaError = err as any;

  if (prismaError.name === "PrismaClientKnownRequestError") {
    switch (prismaError.code) {
      case "P2002": {
        const target = (prismaError.meta?.target as string[])?.join(", ") || "field";
        return res.status(409).json({
          success: false,
          message: `A record with this ${target} already exists`,
        });
      }
      case "P2025":
        return res.status(404).json({
          success: false,
          message: "Record not found",
        });
      case "P2003":
        return res.status(400).json({
          success: false,
          message: "Related record not found. Check referenced IDs.",
        });
      default:
        return res.status(400).json({
          success: false,
          message: `Database error: ${err.message}`,
        });
    }
  }

  if (prismaError.name === "PrismaClientValidationError") {
    return res.status(400).json({
      success: false,
      message: "Invalid data provided to the database",
    });
  }

  // Fallback for unknown errors
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
}
