import type { Socket } from "socket.io-client";
import { clientEvents } from "@/lib/socket/events";

export function emitJoinSession(socket: Socket, sessionId: string) {
  socket.emit(clientEvents.joinSession, sessionId);
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
