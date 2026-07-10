import { AppError } from "./app-error.js";

export class ForbiddenError extends AppError {
  readonly statusCode = 403;
  readonly code = "FORBIDDEN";

  constructor(message = "Forbidden") {
    super(message);
  }
}
