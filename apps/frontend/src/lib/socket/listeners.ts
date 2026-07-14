import {
  cursorMovedPayloadSchema,
  joinSessionSuccessPayloadSchema,
  participantControlsUpdatedPayloadSchema,
  participantEventPayloadSchema,
  presenceUpdatedPayloadSchema,
  sessionEndedPayloadSchema,
  socketErrorPayloadSchema,
  teacherOfflinePayloadSchema,
  type CursorMovedPayload,
  type JoinSessionSuccessPayload,
  type ParticipantControlsUpdatedPayload,
  type ParticipantEventPayload,
  type Presence,
  type PresenceUpdatedPayload,
  type SessionEndedPayload,
  type SocketErrorPayload,
  type TeacherOfflinePayload
} from "@english-learning/contracts/socket/schema";

export type {
  CursorMovedPayload,
  JoinSessionSuccessPayload,
  ParticipantControlsUpdatedPayload,
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

export function parseJoinSessionSuccessPayload(
  data: unknown
): JoinSessionSuccessPayload {
  return joinSessionSuccessPayloadSchema.parse(data);
}

export function parseParticipantControlsUpdatedPayload(
  data: unknown
): ParticipantControlsUpdatedPayload {
  return participantControlsUpdatedPayloadSchema.parse(data);
}
