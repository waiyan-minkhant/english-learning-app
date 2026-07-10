export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: string;

  readonly expose = true;
  readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
  }
}
