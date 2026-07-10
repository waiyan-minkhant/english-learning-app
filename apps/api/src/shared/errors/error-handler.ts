import type { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger.js";
import { AppError } from "./app-error.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError && err.expose) {
    const body: { code: string; message: string; details?: unknown } = {
      code: err.code,
      message: err.message
    };

    if (err.details !== undefined) {
      body.details = err.details;
    }

    return res.status(err.statusCode).json(body);
  }

  logger.error(err);

  return res.status(500).json({
    code: "INTERNAL_SERVER_ERROR",
    message: "Unexpected server error"
  });
}
