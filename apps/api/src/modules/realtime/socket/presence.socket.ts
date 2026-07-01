import type { Socket } from "socket.io";
import { handleSocketDisconnect } from "../services/presence.service.js";

/** Wire presence lifecycle on socket drop (refresh, tab close, network). */
export function registerPresenceSocketHandlers(socket: Socket) {
  socket.on("disconnect", () => {
    console.log("[presence] disconnect", { socketId: socket.id });
    void handleSocketDisconnect(socket);
  });
}
