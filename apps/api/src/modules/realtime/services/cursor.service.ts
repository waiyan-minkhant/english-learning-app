import type { AuthUser } from "@english-learning/contracts";
import { clientEvents, serverEvents } from "@english-learning/contracts/socket/events";
import { cursorMovePayloadSchema } from "@english-learning/contracts/socket/schema";
import type { Socket } from "socket.io";
import { isSessionLive } from "../../session/services/session.service.js";
import { emitSocketError } from "../realtime.gateway.js";
import * as connectionService from "./connection.service.js";

function getSocketUser(socket: Socket): AuthUser | null {
  const user = (socket.data as { user?: AuthUser }).user;
  return user ?? null;
}

export async function handleMoveCursor(socket: Socket, payload: unknown) {
  const user = getSocketUser(socket);
  if (!user) return;

  const parsed = cursorMovePayloadSchema.safeParse(payload);
  if (!parsed.success) return;

  const { sessionId, x, y } = parsed.data;
  const connection = await connectionService.getConnection(socket.id);
  if (!connection || connection.roomId !== sessionId) return;

  if (!(await isSessionLive(connection.roomId))) {
    await connectionService.unbindSocket(socket.id);
    emitSocketError(socket, {
      request: clientEvents.moveCursor,
      code: "SESSION_NOT_LIVE",
      message: "The class has already ended."
    });
    return;
  }

  socket.to(sessionId).emit(serverEvents.cursorMoved, {
    sessionId,
    userId: user.id,
    x,
    y
  });
}
