import type { AuthUser } from "@english-learning/contracts";
import { serverEvents } from "@english-learning/contracts/socket/events";
import { cursorMovePayloadSchema } from "@english-learning/contracts/socket/schema";
import type { Socket } from "socket.io";
import { getSocketContext } from "./presence.service.js";

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
  const context = await getSocketContext(socket.id);
  if (!context || context.sessionId !== sessionId) return;

  socket.to(sessionId).emit(serverEvents.cursorMoved, {
    sessionId,
    userId: user.id,
    x,
    y
  });
}
