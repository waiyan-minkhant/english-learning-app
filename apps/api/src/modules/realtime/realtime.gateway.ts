import type { Server } from "socket.io";
import type { Socket } from "socket.io";
import { serverEvents } from "@english-learning/contracts/socket/events";
import type { SocketErrorPayload } from "@english-learning/contracts/socket/schema";

let io: Server | null = null;

export function initializeRealtime(server: Server) {
  io = server;
}

export function getRealtimeServer(): Server {
  if (!io) {
    throw new Error("Realtime server not initialized");
  }

  return io;
}

export function emitToRoom(
  roomId: string,
  event: string,
  payload: unknown
) {
  getRealtimeServer().to(roomId).emit(event, payload);
}

export function disconnectRoom(roomId: string, close = true) {
  getRealtimeServer().in(roomId).disconnectSockets(close);
}

export function emitSocketError(socket: Socket, payload: SocketErrorPayload) {
  socket.emit(serverEvents.socketError, payload);
}
