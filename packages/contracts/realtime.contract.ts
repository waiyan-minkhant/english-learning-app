import { z } from "zod";

/** Shared call-room id (DB roomId, Socket.IO room, LiveKit room name). */
export const roomIdSchema = z
  .string()
  .min(1, "Room id is required")
  .max(64, "Room id must be at most 64 characters")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "Room id may only contain letters, numbers, hyphens, and underscores"
  );

export const realtimeSessionStatusSchema = z.enum([
  "scheduled",
  "live",
  "ended"
]);

export const realtimeSessionSchema = z.object({
  id: z.uuid(),
  roomId: roomIdSchema,
  status: realtimeSessionStatusSchema,
  startedAt: z.iso.datetime().nullable(),
  endedAt: z.iso.datetime().nullable(),
  classId: z.uuid()
});

export const realtimeSessionCreateSchema = z.object({
  roomId: roomIdSchema,
  status: realtimeSessionStatusSchema.default("scheduled"),
  startedAt: z.iso.datetime().nullable().optional(),
  endedAt: z.iso.datetime().nullable().optional()
});

export const realtimeSessionUpdateSchema = z.object({
  status: realtimeSessionStatusSchema.optional(),
  startedAt: z.iso.datetime().nullable().optional(),
  endedAt: z.iso.datetime().nullable().optional()
});

export type RoomId = z.infer<typeof roomIdSchema>;
export type RealtimeSessionStatus = z.infer<typeof realtimeSessionStatusSchema>;
export type RealtimeSession = z.infer<typeof realtimeSessionSchema>;
export type RealtimeSessionCreate = z.infer<typeof realtimeSessionCreateSchema>;
export type RealtimeSessionUpdate = z.infer<typeof realtimeSessionUpdateSchema>;
