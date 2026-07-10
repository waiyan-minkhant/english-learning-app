import { fetchApi } from "@/lib/api-client";
import {
  parseAuthMeResponse,
  type AuthMeResponse,
  type LoginRequest
} from "@/features/auth/lib/auth";

export const authService = {
  async register(credentials: LoginRequest): Promise<AuthMeResponse> {
    return parseAuthMeResponse(
      await fetchApi("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials)
      })
    );
  },

  async login(credentials: LoginRequest): Promise<AuthMeResponse> {
    return parseAuthMeResponse(
      await fetchApi("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials)
      })
    );
  },

  async me(): Promise<AuthMeResponse> {
    return parseAuthMeResponse(
      await fetchApi("/auth/me", { method: "GET" })
    );
  },

  async logout(): Promise<void> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/auth/logout`,
      { method: "POST", credentials: "include" }
    );

    if (!response.ok && response.status !== 204) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.message || "Logout failed");
    }
  }
};
