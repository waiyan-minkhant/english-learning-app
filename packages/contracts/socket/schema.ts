import { z } from "zod";
import { userRoleSchema } from "@english-learning/contracts";
import { roomIdSchema } from "@english-learning/contracts/realtime";

export const joinSessionPayloadSchema = roomIdSchema;

export const endSessionPayloadSchema = roomIdSchema;

export const sessionEndedPayloadSchema = z.object({
  sessionId: roomIdSchema
});

export const presenceStatusSchema = z.enum([
  "online",
  "reconnecting",
  "offline"
]);

export const presenceSchema = z.object({
  userId: z.uuid(),
  email: z.email(),
  role: userRoleSchema,
  status: presenceStatusSchema
});

export const presenceUpdatedPayloadSchema = z.object({
  sessionId: roomIdSchema,
  participants: z.array(presenceSchema)
});

export const participantEventPayloadSchema = z.object({
  sessionId: roomIdSchema,
  userId: z.uuid()
});

export const teacherOfflinePayloadSchema = participantEventPayloadSchema;

/** Normalized position on the lesson canvas (0–1), not window pixels. */
export const normalizedCursorCoordSchema = z.number().min(0).max(1);

export const cursorMovePayloadSchema = z.object({
  sessionId: roomIdSchema,
  x: normalizedCursorCoordSchema,
  y: normalizedCursorCoordSchema
});

export const cursorMovedPayloadSchema = z.object({
  sessionId: roomIdSchema,
  userId: z.uuid(),
  x: normalizedCursorCoordSchema,
  y: normalizedCursorCoordSchema
});

export type JoinSessionPayload = z.infer<typeof joinSessionPayloadSchema>;
export type EndSessionPayload = z.infer<typeof endSessionPayloadSchema>;
export type SessionEndedPayload = z.infer<typeof sessionEndedPayloadSchema>;
export type PresenceStatus = z.infer<typeof presenceStatusSchema>;
export type Presence = z.infer<typeof presenceSchema>;
export type PresenceUpdatedPayload = z.infer<typeof presenceUpdatedPayloadSchema>;
export type ParticipantEventPayload = z.infer<typeof participantEventPayloadSchema>;
export type TeacherOfflinePayload = z.infer<typeof teacherOfflinePayloadSchema>;
export type CursorMovePayload = z.infer<typeof cursorMovePayloadSchema>;
export type CursorMovedPayload = z.infer<typeof cursorMovedPayloadSchema>;
