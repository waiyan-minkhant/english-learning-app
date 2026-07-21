import { serverEvents } from "@english-learning/contracts/socket/events";
import type { LessonAttemptSubmittedPayload } from "@english-learning/contracts/socket/schema";
import { emitToRoom } from "../../realtime/realtime.gateway.js";

type SessionLike = {
  id: string;
  mode: string;
  liveSession?: { roomId: string } | null;
};

export function broadcastAttemptSubmitted(
  session: SessionLike,
  payload: Omit<
    LessonAttemptSubmittedPayload,
    "learningSessionId" | "liveSessionRoomId"
  >
) {
  if (session.mode !== "classroom" || !session.liveSession?.roomId) return;

  const roomId = session.liveSession.roomId;
  const full: LessonAttemptSubmittedPayload = {
    learningSessionId: session.id,
    liveSessionRoomId: roomId,
    ...payload
  };

  try {
    emitToRoom(roomId, serverEvents.lessonAttemptSubmitted, full);
  } catch {
    // Realtime may not be up in tests / early boot
  }
}
