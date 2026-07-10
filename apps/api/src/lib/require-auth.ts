import type { AuthUser } from "@english-learning/contracts";
import type { Request } from "express";
import {
  AUTH_COOKIE_NAME,
  verifyToken
} from "../modules/auth/services/auth.service.js";
import { UnauthorizedError } from "../shared/errors/auth-error.js";
import { ForbiddenError } from "../shared/errors/forbidden-error.js";

export function getAuthUser(req: Request): AuthUser | null {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (!token) return null;

  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function requireAuth(req: Request): AuthUser {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (!token) {
    throw new UnauthorizedError();
  }

  try {
    return verifyToken(token);
  } catch {
    throw new UnauthorizedError("Invalid token");
  }
}

export function requireRole(user: AuthUser, role: AuthUser["role"]) {
  if (user.role !== role) {
    throw new ForbiddenError(`Only ${role}s can perform this action`);
  }
}
