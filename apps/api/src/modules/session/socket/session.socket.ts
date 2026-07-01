import { clientEvents } from "@english-learning/contracts/socket/events";
import type { Socket } from "socket.io";
import {
  handleEndSession,
  handleJoinSession,
  handleLeaveSession
} from "../services/session.service.js";

export function registerSessionSocketHandlers(socket: Socket) {
  socket.on(clientEvents.joinSession, (payload: unknown) => {
    void handleJoinSession(socket, payload);
  });

  socket.on(clientEvents.leaveSession, (payload: unknown) => {
    void handleLeaveSession(socket, payload);
  });

  socket.on(clientEvents.endSession, (payload: unknown) => {
    void handleEndSession(socket, payload);
  });
}
