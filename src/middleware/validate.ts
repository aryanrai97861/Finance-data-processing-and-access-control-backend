import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

/**
 * Validation middleware using Zod schemas.
 * Validates request body, query params, and route params.
 *
 * Usage: validate(schema) where schema has optional body/query/params keys.
 */
export function validate(schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.query) {
        const parsedQuery = schema.query.parse(req.query) as Record<string, unknown>;

        // In Express 5, req.query can be getter-backed; mutate the existing object safely.
        const queryTarget = req.query as Record<string, unknown>;
        for (const key of Object.keys(queryTarget)) {
          delete queryTarget[key];
        }
        Object.assign(queryTarget, parsedQuery);
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params) as any;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((err: any) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        return _res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: formattedErrors,
        });
      }
      next(error);
    }
  };
}
