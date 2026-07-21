"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";
import type { Socket } from "socket.io-client";
import { emitRevealLessonAnswers } from "@/lib/socket/emit";
import { serverEvents } from "@/lib/socket/events";
import {
  parseLessonAnswersRevealedPayload,
  parseLessonStateUpdatedPayload
} from "@/lib/socket/listeners";

type UseLessonRevealSyncOptions = {
  sessionId?: string;
  learningSessionId?: string | null;
  lessonId: string;
  itemId?: string;
  socketRef?: RefObject<Socket | null>;
  enabled: boolean;
  /** When true, treat remote answerRevealed as revealed */
  remoteAnswerRevealed?: boolean;
};

export function useLessonRevealSync({
  sessionId,
  learningSessionId,
  lessonId,
  itemId,
  socketRef,
  enabled,
  remoteAnswerRevealed = false
}: UseLessonRevealSyncOptions) {
  const [revealSignal, setRevealSignal] = useState(0);

  useEffect(() => {
    setRevealSignal(0);
  }, [lessonId, itemId]);

  useEffect(() => {
    if (remoteAnswerRevealed) {
      setRevealSignal((current) => current + 1);
    }
  }, [remoteAnswerRevealed, itemId]);

  useEffect(() => {
    if (!enabled || !sessionId || !itemId || !socketRef) return;

    const socket = socketRef.current;
    if (!socket) return;

    const onLessonAnswersRevealed = (payload: unknown) => {
      try {
        const parsed = parseLessonAnswersRevealedPayload(payload);
        if (
          parsed.sessionId === sessionId &&
          parsed.lessonId === lessonId &&
          parsed.itemId === itemId
        ) {
          setRevealSignal((current) => current + 1);
        }
      } catch {
        console.warn("[realtime] invalid lesson_answers_revealed payload");
      }
    };

    const onLessonStateUpdated = (payload: unknown) => {
      try {
        const parsed = parseLessonStateUpdatedPayload(payload);
        if (
          parsed.liveSessionRoomId === sessionId &&
          parsed.lessonId === lessonId &&
          parsed.currentLessonItemId === itemId &&
          parsed.answerRevealed
        ) {
          setRevealSignal((current) => current + 1);
        }
      } catch {
        // ignore
      }
    };

    socket.on(serverEvents.lessonAnswersRevealed, onLessonAnswersRevealed);
    socket.on(serverEvents.lessonStateUpdated, onLessonStateUpdated);

    return () => {
      socket.off(serverEvents.lessonAnswersRevealed, onLessonAnswersRevealed);
      socket.off(serverEvents.lessonStateUpdated, onLessonStateUpdated);
    };
  }, [enabled, sessionId, lessonId, itemId, socketRef]);

  const publishReveal = useCallback(() => {
    if (!enabled || !sessionId || !itemId || !learningSessionId || !socketRef)
      return;
    const socket = socketRef.current;
    if (!socket?.connected) return;

    emitRevealLessonAnswers(socket, {
      sessionId,
      learningSessionId,
      lessonId,
      itemId
    });
  }, [enabled, sessionId, learningSessionId, lessonId, itemId, socketRef]);

  return { publishReveal, revealSignal };
}
