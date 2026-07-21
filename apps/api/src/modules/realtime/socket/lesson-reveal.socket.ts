import { clientEvents } from "@english-learning/contracts/socket/events";
import type { Socket } from "socket.io";
import {
  handleRevealLessonAnswers,
  handleSetLessonItem
} from "../services/lesson-sync.service.js";

export function registerLessonRevealSocketHandlers(socket: Socket) {
  socket.on(clientEvents.revealLessonAnswers, (payload: unknown) => {
    void handleRevealLessonAnswers(socket, payload);
  });
  socket.on(clientEvents.setLessonItem, (payload: unknown) => {
    void handleSetLessonItem(socket, payload);
  });
}
