import { fetchApi } from "@/lib/api-client";
import {
  parseSessionJoinResponse,
  parseSessionRoomResponse,
  type SessionJoinResponse,
  type SessionRoomResponse
} from "@/features/session/lib/session";

export const sessionService = {
  async start(): Promise<SessionRoomResponse> {
    return parseSessionRoomResponse(
      await fetchApi("/sessions/start", { method: "POST" })
    );
  },

  async join(): Promise<SessionJoinResponse> {
    return parseSessionJoinResponse(
      await fetchApi("/sessions/join", { method: "POST" })
    );
  }
};
