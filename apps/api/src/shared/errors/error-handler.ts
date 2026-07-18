import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { logger } from "../utils/logger.js";
import { AppError } from "./app-error.js";
import { ValidationError } from "./validation-error.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const normalized =
    err instanceof multer.MulterError
      ? new ValidationError(
          err.code === "LIMIT_FILE_SIZE"
            ? "Audio file is too large (max 10MB)"
            : err.message
        )
      : err;

  if (normalized instanceof AppError && normalized.expose) {
    const body: { code: string; message: string; details?: unknown } = {
      code: normalized.code,
      message: normalized.message
    };

    if (normalized.details !== undefined) {
      body.details = normalized.details;
    }

    return res.status(normalized.statusCode).json(body);
  }

  logger.error(err);

  return res.status(500).json({
    code: "INTERNAL_SERVER_ERROR",
    message: "Unexpected server error"
  });
}
