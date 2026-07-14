import { clientEvents } from "@english-learning/contracts/socket/events";
import type { Socket } from "socket.io";
import {
  updateBulkParticipantControls,
  updateParticipantControls
} from "../services/participant-controls.service.js";

export function registerParticipantControlsSocketHandlers(socket: Socket) {
  socket.on(clientEvents.updateParticipantControls, (payload: unknown) => {
    void updateParticipantControls(socket, payload);
  });

  socket.on(clientEvents.updateBulkParticipantControls, (payload: unknown) => {
    void updateBulkParticipantControls(socket, payload);
  });
}
