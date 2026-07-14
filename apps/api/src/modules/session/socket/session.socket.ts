import { clientEvents } from "@english-learning/contracts/socket/events";
import type { Socket } from "socket.io";
import {
  handleEndSession,
  handleJoinSession,
  handleLeaveSession
} from "../services/session.service.js";

export function registerSessionSocketHandlers(socket: Socket) {
  socket.on(clientEvents.joinSession, (payload: unknown, ack?: (response: unknown) => void) => {
    void handleJoinSession(socket, payload, ack);
  });

  socket.on(clientEvents.leaveSession, (payload: unknown) => {
    void handleLeaveSession(socket, payload);
  });

  socket.on(clientEvents.endSession, (payload: unknown) => {
    void handleEndSession(socket, payload);
  });
}
