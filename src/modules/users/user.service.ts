import prisma from "../../utils/prisma";
import { ApiError } from "../../utils/apiError";
import { Role, UserStatus } from "../../generated/prisma/client";

export class UserService {
  /**
   * List all users with pagination
   */
  async listUsers(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { records: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single user by ID
   */
  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { records: true } },
      },
    });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    return user;
  }

  /**
   * Update a user's name, role, or status
   */
  async updateUser(
    id: string,
    data: { name?: string; role?: Role; status?: UserStatus },
    currentUserId: string
  ) {
    // Prevent admin from modifying their own role or status
    if (id === currentUserId && (data.role || data.status)) {
      throw ApiError.badRequest("You cannot change your own role or status");
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw ApiError.notFound("User not found");
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  /**
   * Delete a user
   */
  async deleteUser(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw ApiError.badRequest("You cannot delete your own account");
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw ApiError.notFound("User not found");
    }

    await prisma.user.delete({ where: { id } });

    return { message: "User deleted successfully" };
  }
}

export const userService = new UserService();
