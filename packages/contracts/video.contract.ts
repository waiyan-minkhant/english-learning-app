import { z } from "zod";
import { roomIdSchema } from "@english-learning/contracts/realtime";

export const videoTokenRequestSchema = z.object({
  roomName: roomIdSchema
});

export const videoTokenResponseSchema = z.object({
  token: z.string().min(1),
  url: z.url(),
  roomName: roomIdSchema
});

export type VideoTokenRequest = z.infer<typeof videoTokenRequestSchema>;
export type VideoTokenResponse = z.infer<typeof videoTokenResponseSchema>;
