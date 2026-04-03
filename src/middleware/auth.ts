import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { ApiError } from "../utils/apiError";
import prisma from "../utils/prisma";

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw ApiError.unauthorized("Missing or invalid authorization header. Use: Bearer <token>");
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!user) {
      throw ApiError.unauthorized("User no longer exists");
    }

    if (user.status === "INACTIVE") {
      throw ApiError.unauthorized("Account is deactivated. Contact an administrator.");
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(ApiError.unauthorized("Invalid or expired token"));
    } else {
      next(ApiError.unauthorized("Authentication failed"));
    }
  }
}
