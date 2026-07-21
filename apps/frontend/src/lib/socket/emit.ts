import type {
  JoinSessionPayload,
  RevealLessonAnswersPayload,
  SetLessonItemPayload,
  UpdateBulkParticipantControlsPayload,
  UpdateParticipantControlsPayload
} from "@english-learning/contracts/socket/schema";
import type { Socket } from "socket.io-client";
import { clientEvents } from "@/lib/socket/events";
import {
  parseJoinSessionSuccessPayload,
  type JoinSessionSuccessPayload
} from "@/lib/socket/listeners";

type JoinSessionAckResponse =
  | JoinSessionSuccessPayload
  | { error: string };

export function emitJoinSessionWithAck(
  socket: Socket,
  payload: JoinSessionPayload
): Promise<JoinSessionSuccessPayload | null> {
  return new Promise((resolve) => {
    socket.emit(
      clientEvents.joinSession,
      payload,
      (response: JoinSessionAckResponse) => {
        if (!response || "error" in response) {
          resolve(null);
          return;
        }

        try {
          resolve(parseJoinSessionSuccessPayload(response));
        } catch {
          resolve(null);
        }
      }
    );
  });
}

export function emitJoinSession(socket: Socket, payload: JoinSessionPayload) {
  void emitJoinSessionWithAck(socket, payload);
}

export function emitLeaveSession(socket: Socket, sessionId: string) {
  socket.emit(clientEvents.leaveSession, sessionId);
}

export function emitEndSession(socket: Socket, sessionId: string) {
  socket.emit(clientEvents.endSession, sessionId);
}

export function emitMoveCursor(
  socket: Socket,
  payload: { sessionId: string; x: number; y: number }
) {
  socket.emit(clientEvents.moveCursor, payload);
}

export function emitUpdateParticipantControls(
  socket: Socket,
  payload: UpdateParticipantControlsPayload
) {
  socket.emit(clientEvents.updateParticipantControls, payload);
}

export function emitUpdateBulkParticipantControls(
  socket: Socket,
  payload: UpdateBulkParticipantControlsPayload
) {
  socket.emit(clientEvents.updateBulkParticipantControls, payload);
}

export function emitRevealLessonAnswers(
  socket: Socket,
  payload: RevealLessonAnswersPayload
) {
  socket.emit(clientEvents.revealLessonAnswers, payload);
}

export function emitSetLessonItem(
  socket: Socket,
  payload: SetLessonItemPayload
) {
  socket.emit(clientEvents.setLessonItem, payload);
}
