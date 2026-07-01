import { z } from "zod";
import {
  realtimeSessionSchema,
  roomIdSchema
} from "@english-learning/contracts/realtime";

export const sessionRoomResponseSchema = z.object({
  roomId: roomIdSchema
});

export const sessionJoinResponseSchema = realtimeSessionSchema;

export type SessionRoomResponse = z.infer<typeof sessionRoomResponseSchema>;
export type SessionJoinResponse = z.infer<typeof sessionJoinResponseSchema>;
