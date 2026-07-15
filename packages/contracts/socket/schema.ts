import { z } from "zod";
import { userRoleSchema } from "@english-learning/contracts";
import { roomIdSchema } from "@english-learning/contracts/realtime";

export const joinSessionPayloadSchema = z.object({
  sessionId: roomIdSchema,
  microphoneEnabled: z.boolean().optional()
});

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
  name: z.string().min(1),
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

export const socketErrorPayloadSchema = z.object({
  request: z.string(),
  code: z.string(),
  message: z.string()
});

export const participantControlsSchema = z.object({
  microphoneEnabled: z.boolean(),
  cursorEnabled: z.boolean()
});

export const participantControlsMapSchema = z.record(
  z.uuid(),
  participantControlsSchema
);

export const updateParticipantControlsPayloadSchema = z
  .object({
    sessionId: roomIdSchema,
    userId: z.uuid(),
    microphoneEnabled: z.boolean().optional(),
    cursorEnabled: z.boolean().optional()
  })
  .refine(
    (value) =>
      value.microphoneEnabled !== undefined || value.cursorEnabled !== undefined,
    { message: "At least one control field is required" }
  );

export const updateBulkParticipantControlsPayloadSchema = z
  .object({
    sessionId: roomIdSchema,
    target: z.literal("all_students"),
    microphoneEnabled: z.boolean().optional(),
    cursorEnabled: z.boolean().optional()
  })
  .refine(
    (value) =>
      value.microphoneEnabled !== undefined || value.cursorEnabled !== undefined,
    { message: "At least one control field is required" }
  );

export const participantControlsUpdatedPayloadSchema = z.object({
  sessionId: roomIdSchema,
  participantControls: participantControlsMapSchema
});

export const joinSessionSuccessPayloadSchema = z.object({
  roomId: roomIdSchema,
  participantControls: participantControlsMapSchema
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
export type SocketErrorPayload = z.infer<typeof socketErrorPayloadSchema>;
export type ParticipantControls = z.infer<typeof participantControlsSchema>;
export type ParticipantControlsMap = z.infer<
  typeof participantControlsMapSchema
>;
export type UpdateParticipantControlsPayload = z.infer<
  typeof updateParticipantControlsPayloadSchema
>;
export type UpdateBulkParticipantControlsPayload = z.infer<
  typeof updateBulkParticipantControlsPayloadSchema
>;
export type ParticipantControlsUpdatedPayload = z.infer<
  typeof participantControlsUpdatedPayloadSchema
>;
export type JoinSessionSuccessPayload = z.infer<
  typeof joinSessionSuccessPayloadSchema
>;
