import { AppError } from "./app-error.js";

export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly code = "VALIDATION_ERROR";

  constructor(message = "Validation failed", details?: unknown) {
    super(message, details);
  }
}
