import { authCredentialsSchema } from "@english-learning/contracts";
import { Router } from "express";
import { asyncHandler } from "../../../shared/errors/async-handler.js";
import { UnauthorizedError } from "../../../shared/errors/auth-error.js";
import { ValidationError } from "../../../shared/errors/validation-error.js";
import {
  AUTH_COOKIE_NAME,
  login,
  register,
  verifyToken
} from "../services/auth.service.js";

const authRouter = Router();

const cookieOptions = {
  httpOnly: true,
  sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as
    | "none"
    | "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000
};

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const parsed = authCredentialsSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Validation failed", parsed.error.flatten());
    }

    const result = await register(parsed.data.email, parsed.data.password);
    res.cookie(AUTH_COOKIE_NAME, result.token, cookieOptions);
    res.status(201).json({ user: result.user });
  })
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const parsed = authCredentialsSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Validation failed", parsed.error.flatten());
    }

    const result = await login(parsed.data.email, parsed.data.password);
    res.cookie(AUTH_COOKIE_NAME, result.token, cookieOptions);
    res.json({ user: result.user });
  })
);

authRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[AUTH_COOKIE_NAME];
    if (!token) {
      throw new UnauthorizedError();
    }

    try {
      const user = verifyToken(token);
      res.json({ user });
    } catch {
      throw new UnauthorizedError("Invalid token");
    }
  })
);

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, cookieOptions);
  res.status(204).send();
});

export { authRouter };
