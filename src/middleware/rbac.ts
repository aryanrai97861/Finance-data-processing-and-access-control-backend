import { Request, Response, NextFunction } from "express";
import { Role } from "../generated/prisma/client";
import { ApiError } from "../utils/apiError";

/**
 * Role-based access control middleware.
 * Restricts access to routes based on user roles.
 *
 * Usage: authorize("ADMIN", "ANALYST")
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Role '${req.user.role}' is not authorized to access this resource. Required: ${allowedRoles.join(", ")}`
        )
      );
    }

    next();
  };
}
