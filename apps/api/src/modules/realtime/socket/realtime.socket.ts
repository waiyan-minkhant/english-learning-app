import { createAdapter } from "@socket.io/redis-adapter";
import type { Server as SocketServer, Socket } from "socket.io";
import { authenticateSocket } from "../../auth/socket/auth-socket.middleware.js";
import { registerSessionSocketHandlers } from "../../session/socket/session.socket.js";
import { registerParticipantControlsSocketHandlers } from "../../session/socket/participant-controls.socket.js";
import { connectRedis, createRedisPubSubClients } from "../../../shared/redis/redis.client.js";
import { initializeRealtime } from "../realtime.gateway.js";
import { registerCursorSocketHandlers } from "./cursor.socket.js";
import { registerPresenceSocketHandlers } from "./presence.socket.js";

export async function attachRealtimeServer(io: SocketServer) {
  await connectRedis();

  const { pubClient, subClient } = await createRedisPubSubClients();
  io.adapter(createAdapter(pubClient, subClient));

  initializeRealtime(io);
  io.use(authenticateSocket);

  io.on("connection", (socket: Socket) => {
    registerSessionSocketHandlers(socket);
    registerParticipantControlsSocketHandlers(socket);
    registerPresenceSocketHandlers(socket);
    registerCursorSocketHandlers(socket);
  });
}
