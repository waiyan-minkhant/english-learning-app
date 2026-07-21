import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUnique } = vi.hoisted(() => ({
  findUnique: vi.fn()
}));

vi.mock("../../../lib/prisma.js", () => ({
  prisma: {
    user: {
      findUnique
    }
  }
}));

import { login, verifyToken } from "./auth.service.js";

const teacherId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

describe("auth.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
  });

  describe("login", () => {
    it("throws for unknown email", async () => {
      findUnique.mockResolvedValue(null);

      await expect(login("missing@example.com", "pass")).rejects.toThrow(
        "Invalid credentials"
      );
    });

    it("throws for invalid password", async () => {
      const passwordHash = await bcrypt.hash("correct", 10);
      findUnique.mockResolvedValue({
        id: teacherId,
        email: "user@example.com",
        name: "user",
        passwordHash,
        role: "teacher"
      });

      await expect(login("user@example.com", "wrong")).rejects.toThrow(
        "Invalid credentials"
      );
    });

    it("returns user and verifiable token on success", async () => {
      const passwordHash = await bcrypt.hash("secret123", 10);
      findUnique.mockResolvedValue({
        id: teacherId,
        email: "user@example.com",
        name: "user",
        passwordHash,
        role: "teacher"
      });

      const result = await login("user@example.com", "secret123");

      expect(result.user).toEqual({
        id: teacherId,
        email: "user@example.com",
        name: "user",
        role: "teacher"
      });
      expect(verifyToken(result.token)).toEqual(result.user);
    });
  });

  describe("verifyToken", () => {
    it("rejects tampered token", async () => {
      const passwordHash = await bcrypt.hash("secret123", 10);
      findUnique.mockResolvedValue({
        id: teacherId,
        email: "user@example.com",
        passwordHash,
        role: "student"
      });

      const { token } = await login("user@example.com", "secret123");
      const tampered = `${token}x`;

      expect(() => verifyToken(tampered)).toThrow();
    });

    it("throws when JWT_SECRET is missing", () => {
      const token = jwt.sign(
        { id: teacherId, email: "a@b.com", name: "a", role: "student" },
        "test-secret",
        { expiresIn: "1h" }
      );
      delete process.env.JWT_SECRET;

      expect(() => verifyToken(token)).toThrow("JWT_SECRET is required");
    });
  });
});
