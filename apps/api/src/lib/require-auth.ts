import type { AuthUser } from "@english-learning/contracts";
import type { Request } from "express";
import {
  AUTH_COOKIE_NAME,
  verifyToken
} from "../modules/auth/services/auth.service.js";

export function getAuthUser(req: Request): AuthUser | null {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (!token) return null;

  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function requireRole(user: AuthUser, role: AuthUser["role"]) {
  if (user.role !== role) {
    throw new Error(`Only ${role}s can perform this action`);
  }
}
