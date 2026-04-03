import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../utils/prisma";
import { env } from "../../config/env";
import { ApiError } from "../../utils/apiError";

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: { email: string; password: string; name: string }) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw ApiError.conflict("A user with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user (default role: VIEWER)
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    // Generate JWT
    const token = this.generateToken(user.id, user.email, user.role);

    return { user, token };
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    // Check if user is active
    if (user.status === "INACTIVE") {
      throw ApiError.unauthorized("Account is deactivated. Contact an administrator.");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    // Generate JWT
    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { records: true },
        },
      },
    });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    return user;
  }

  private generateToken(id: string, email: string, role: string): string {
    return jwt.sign({ id, email, role }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }
}

export const authService = new AuthService();
