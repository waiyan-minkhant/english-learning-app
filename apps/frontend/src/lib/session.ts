import {
  sessionJoinResponseSchema,
  sessionRoomResponseSchema
} from "@english-learning/contracts/session";

export type SessionRoomResponse =
  import("@english-learning/contracts/session").SessionRoomResponse;

export type SessionJoinResponse =
  import("@english-learning/contracts/session").SessionJoinResponse;

export function parseSessionRoomResponse(data: unknown): SessionRoomResponse {
  return sessionRoomResponseSchema.parse(data);
}

export function parseSessionJoinResponse(data: unknown): SessionJoinResponse {
  return sessionJoinResponseSchema.parse(data);
}
