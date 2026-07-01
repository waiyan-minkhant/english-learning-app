import { clientEvents } from "@english-learning/contracts/socket/events";
import type { Socket } from "socket.io";
import { handleMoveCursor } from "../services/cursor.service.js";

export function registerCursorSocketHandlers(socket: Socket) {
  socket.on(clientEvents.moveCursor, (payload: unknown) => {
    void handleMoveCursor(socket, payload);
  });
}
