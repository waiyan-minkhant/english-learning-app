import {
  cursorMovedPayloadSchema,
  participantEventPayloadSchema,
  presenceUpdatedPayloadSchema,
  sessionEndedPayloadSchema,
  socketErrorPayloadSchema,
  teacherOfflinePayloadSchema,
  type CursorMovedPayload,
  type ParticipantEventPayload,
  type Presence,
  type PresenceUpdatedPayload,
  type SessionEndedPayload,
  type SocketErrorPayload,
  type TeacherOfflinePayload
} from "@english-learning/contracts/socket/schema";

export type {
  CursorMovedPayload,
  ParticipantEventPayload,
  Presence,
  PresenceUpdatedPayload,
  SessionEndedPayload,
  SocketErrorPayload,
  TeacherOfflinePayload
};

export function parsePresenceUpdatedPayload(
  data: unknown
): PresenceUpdatedPayload {
  return presenceUpdatedPayloadSchema.parse(data);
}

export function parseParticipantEventPayload(
  data: unknown
): ParticipantEventPayload {
  return participantEventPayloadSchema.parse(data);
}

export function parseCursorMovedPayload(data: unknown): CursorMovedPayload {
  return cursorMovedPayloadSchema.parse(data);
}

export function parseTeacherOfflinePayload(
  data: unknown
): TeacherOfflinePayload {
  return teacherOfflinePayloadSchema.parse(data);
}

export function parseSessionEndedPayload(data: unknown): SessionEndedPayload {
  return sessionEndedPayloadSchema.parse(data);
}

export function parseSocketErrorPayload(data: unknown): SocketErrorPayload {
  return socketErrorPayloadSchema.parse(data);
}
