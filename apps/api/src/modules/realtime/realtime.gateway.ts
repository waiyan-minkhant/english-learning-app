import type { Server } from "socket.io";

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
