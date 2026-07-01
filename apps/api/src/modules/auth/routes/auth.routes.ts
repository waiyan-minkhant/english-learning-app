import { Router } from "express";
import { authCredentialsSchema } from "@english-learning/contracts";
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

authRouter.post("/register", async (req, res) => {
  const parsed = authCredentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }

  try {
    const result = await register(parsed.data.email, parsed.data.password);
    res.cookie(AUTH_COOKIE_NAME, result.token, cookieOptions);
    return res.status(201).json({ user: result.user });
  } catch (error) {
    return res.status(400).json({
      message: error instanceof Error ? error.message : "Registration failed"
    });
  }
});

authRouter.post("/login", async (req, res) => {
  const parsed = authCredentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }

  try {
    const result = await login(parsed.data.email, parsed.data.password);
    res.cookie(AUTH_COOKIE_NAME, result.token, cookieOptions);
    return res.json({ user: result.user });
  } catch (error) {
    return res.status(401).json({
      message: error instanceof Error ? error.message : "Login failed"
    });
  }
});

authRouter.get("/me", (req, res) => {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ message: "Unauthenticated" });
  }

  try {
    const user = verifyToken(token);
    return res.json({ user });
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, cookieOptions);
  return res.status(204).send();
});

export { authRouter };
