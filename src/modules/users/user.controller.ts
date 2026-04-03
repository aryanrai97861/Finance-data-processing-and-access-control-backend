import { Request, Response, NextFunction } from "express";
import { userService } from "./user.service";
import { sendResponse } from "../../utils/apiResponse";

export class UserController {
  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;

      const result = await userService.listUsers(page, limit, search);

      sendResponse({
        res,
        message: "Users retrieved successfully",
        data: result.users,
        meta: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.getUserById(req.params.id as string);

      sendResponse({
        res,
        message: "User retrieved successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.updateUser(req.params.id as string, req.body, req.user!.id);

      sendResponse({
        res,
        message: "User updated successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      await userService.deleteUser(req.params.id as string, req.user!.id);

      sendResponse({
        res,
        message: "User deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
