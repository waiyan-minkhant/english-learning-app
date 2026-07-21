import type { AuthUser } from "@english-learning/contracts";
import { authUserSchema } from "@english-learning/contracts";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../../lib/prisma.js";
import { UnauthorizedError } from "../../../shared/errors/auth-error.js";

const JWT_EXPIRES_IN = "7d";
export const AUTH_COOKIE_NAME = "accessToken";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is required");
  }

  return secret;
}

function signToken(user: AuthUser) {
  return jwt.sign(user, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new UnauthorizedError("Invalid credentials");
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new UnauthorizedError("Invalid credentials");
  }

  const safeUser: AuthUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  };

  return { user: safeUser, token: signToken(safeUser) };
}

export function verifyToken(token: string): AuthUser {
  const payload = jwt.verify(token, getJwtSecret());
  return authUserSchema.parse(payload);
}
