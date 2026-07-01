import { clientEvents, serverEvents } from "@english-learning/contracts/socket/events";
import {
  cursorMovedPayloadSchema,
  participantEventPayloadSchema,
  presenceUpdatedPayloadSchema,
  sessionEndedPayloadSchema,
  teacherOfflinePayloadSchema,
  type CursorMovedPayload,
  type ParticipantEventPayload,
  type Presence,
  type PresenceUpdatedPayload,
  type SessionEndedPayload,
  type TeacherOfflinePayload
} from "@english-learning/contracts/socket/schema";

export { clientEvents, serverEvents };

export type {
  CursorMovedPayload,
  ParticipantEventPayload,
  Presence,
  PresenceUpdatedPayload,
  SessionEndedPayload,
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
