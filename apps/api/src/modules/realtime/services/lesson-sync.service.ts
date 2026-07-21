import type { AuthUser } from "@english-learning/contracts";
import { clientEvents, serverEvents } from "@english-learning/contracts/socket/events";
import {
  revealLessonAnswersPayloadSchema,
  setLessonItemPayloadSchema,
  type LessonStateUpdatedPayload
} from "@english-learning/contracts/socket/schema";
import type { Socket } from "socket.io";
import { isSessionLive } from "../../session/services/session.service.js";
import { emitSocketError, emitToRoom } from "../realtime.gateway.js";
import * as connectionService from "./connection.service.js";
import {
  getLearningSessionService,
  toLearningSessionDto
} from "../../learning/services/learning-session.service.js";
import { LearningSessionRepository } from "../../learning/repositories/learning-session.repository.js";

function getSocketUser(socket: Socket): AuthUser | null {
  const user = (socket.data as { user?: AuthUser }).user;
  return user ?? null;
}

function toStatePayload(
  session: ReturnType<typeof toLearningSessionDto>
): LessonStateUpdatedPayload | null {
  if (!session.liveSessionRoomId) return null;
  return {
    learningSessionId: session.id,
    liveSessionRoomId: session.liveSessionRoomId,
    lessonId: session.lessonId,
    currentLessonItemId: session.currentLessonItemId,
    answerRevealed: session.answerRevealed,
    status: session.status
  };
}

export function broadcastLessonState(
  session: ReturnType<typeof toLearningSessionDto>
) {
  const payload = toStatePayload(session);
  if (!payload) return;
  emitToRoom(
    payload.liveSessionRoomId,
    serverEvents.lessonStateUpdated,
    payload
  );
}

export async function emitLessonStateToSocket(
  socket: Socket,
  roomId: string
) {
  const repo = new LearningSessionRepository();
  const live = await repo.findLiveByRoomId(roomId);
  if (!live) return;
  const payload = toStatePayload(toLearningSessionDto(live));
  if (!payload) return;
  socket.emit(serverEvents.lessonStateUpdated, payload);
}

export async function handleSetLessonItem(socket: Socket, payload: unknown) {
  const user = getSocketUser(socket);
  if (!user || user.role !== "teacher") return;

  const parsed = setLessonItemPayloadSchema.safeParse(payload);
  if (!parsed.success) return;

  const { sessionId, learningSessionId, itemId } = parsed.data;
  const connection = await connectionService.getConnection(socket.id);
  if (!connection || connection.roomId !== sessionId) return;

  if (!(await isSessionLive(connection.roomId))) {
    await connectionService.unbindSocket(socket.id);
    emitSocketError(socket, {
      request: clientEvents.setLessonItem,
      code: "SESSION_NOT_LIVE",
      message: "The class has already ended."
    });
    return;
  }

  try {
    const session = await getLearningSessionService().setCurrentItem(
      user.id,
      learningSessionId,
      itemId
    );
    broadcastLessonState(session);
  } catch {
    emitSocketError(socket, {
      request: clientEvents.setLessonItem,
      code: "SET_ITEM_FAILED",
      message: "Could not update the current lesson item."
    });
  }
}

export async function handleRevealLessonAnswers(
  socket: Socket,
  payload: unknown
) {
  const user = getSocketUser(socket);
  if (!user || user.role !== "teacher") return;

  const parsed = revealLessonAnswersPayloadSchema.safeParse(payload);
  if (!parsed.success) return;

  const { sessionId, learningSessionId, lessonId, itemId } = parsed.data;
  const connection = await connectionService.getConnection(socket.id);
  if (!connection || connection.roomId !== sessionId) return;

  if (!(await isSessionLive(connection.roomId))) {
    await connectionService.unbindSocket(socket.id);
    emitSocketError(socket, {
      request: clientEvents.revealLessonAnswers,
      code: "SESSION_NOT_LIVE",
      message: "The class has already ended."
    });
    return;
  }

  try {
    const session = await getLearningSessionService().revealAnswers(
      user.id,
      learningSessionId
    );
    broadcastLessonState(session);
    socket.to(sessionId).emit(serverEvents.lessonAnswersRevealed, {
      sessionId,
      learningSessionId,
      lessonId,
      itemId
    });
  } catch {
    emitSocketError(socket, {
      request: clientEvents.revealLessonAnswers,
      code: "REVEAL_FAILED",
      message: "Could not reveal answers."
    });
  }
}
