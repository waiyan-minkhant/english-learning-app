import { AppError } from "./app-error.js";

export class ExternalServiceError extends AppError {
  readonly statusCode = 502;
  readonly code = "EXTERNAL_SERVICE_ERROR";

  constructor(message = "External service failed", details?: unknown) {
    super(message, details);
  }
}
