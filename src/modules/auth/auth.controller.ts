import { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";
import { sendResponse } from "../../utils/apiResponse";

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name } = req.body;
      const result = await authService.register({ email, password, name });

      sendResponse({
        res,
        statusCode: 201,
        message: "User registered successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      sendResponse({
        res,
        message: "Login successful",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.getProfile(req.user!.id);

      sendResponse({
        res,
        message: "Profile retrieved successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
