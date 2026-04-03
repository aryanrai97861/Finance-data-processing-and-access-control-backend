import { Response } from "express";

interface ApiResponseOptions<T> {
  res: Response;
  statusCode?: number;
  message: string;
  data?: T;
  meta?: Record<string, unknown>;
}

export function sendResponse<T>({ res, statusCode = 200, message, data, meta }: ApiResponseOptions<T>) {
  const response: Record<string, unknown> = {
    success: true,
    message,
  };

  if (data !== undefined) {
    response.data = data;
  }

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
}
