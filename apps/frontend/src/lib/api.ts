import {
  parseAuthMeResponse,
  type AuthMeResponse,
  type LoginRequest
} from "@/lib/auth";
import { clearStoredUser, saveStoredUser } from "@/lib/auth-storage";
import {
  parseSessionJoinResponse,
  parseSessionRoomResponse
} from "@/lib/session";
import {
  parseVideoTokenResponse,
  type VideoTokenResponse
} from "@/lib/video";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function parseResponse(response: Response) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
}

export async function registerRequest(
  credentials: LoginRequest
): Promise<AuthMeResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(credentials)
  });

  const data = parseAuthMeResponse(await parseResponse(response));
  saveStoredUser(data.user);
  return data;
}

export async function loginRequest(
  credentials: LoginRequest
): Promise<AuthMeResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(credentials)
  });

  const data = parseAuthMeResponse(await parseResponse(response));
  saveStoredUser(data.user);
  return data;
}

export async function meRequest(): Promise<AuthMeResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "GET",
    credentials: "include"
  });

  const data = parseAuthMeResponse(await parseResponse(response));
  saveStoredUser(data.user);
  return data;
}

export async function logoutRequest(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include"
  });

  clearStoredUser();

  if (!response.ok && response.status !== 204) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || "Logout failed");
  }
}

export async function startSessionRequest() {
  const response = await fetch(`${API_BASE_URL}/sessions/start`, {
    method: "POST",
    credentials: "include"
  });

  return parseSessionRoomResponse(await parseResponse(response));
}

export async function joinSessionRequest() {
  const response = await fetch(`${API_BASE_URL}/sessions/join`, {
    method: "POST",
    credentials: "include"
  });

  return parseSessionJoinResponse(await parseResponse(response));
}

export async function getVideoToken(
  roomName: string
): Promise<VideoTokenResponse> {
  const response = await fetch(`${API_BASE_URL}/video/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ roomName })
  });

  return parseVideoTokenResponse(await parseResponse(response));
}
