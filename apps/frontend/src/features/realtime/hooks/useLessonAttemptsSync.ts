"use client";

import { useEffect, useMemo, useState, type RefObject } from "react";
import type { ConversationScores } from "@english-learning/contracts/learning";
import type { LessonAttemptSubmittedPayload } from "@english-learning/contracts/socket/schema";
import type { SessionAttempt } from "@english-learning/contracts/learning-session";
import type { Socket } from "socket.io-client";
import { serverEvents } from "@/lib/socket/events";
import { parseLessonAttemptSubmittedPayload } from "@/lib/socket/listeners";
import { learningSessionService } from "@/services/learningSessionService";

export type StudentAttemptView = {
  userId: string;
  attemptId: string;
  type: LessonAttemptSubmittedPayload["type"];
  selectedAnswer?: string;
  submittedOrder?: string[];
  selectedPairs?: Record<string, string>;
  transcript?: string;
  feedback?: string;
  scores?: ConversationScores;
  correct?: boolean;
  createdAt: string;
};

function toView(
  payload: Pick<
    LessonAttemptSubmittedPayload,
    | "userId"
    | "attemptId"
    | "type"
    | "selectedAnswer"
    | "submittedOrder"
    | "selectedPairs"
    | "transcript"
    | "feedback"
    | "scores"
    | "correct"
    | "createdAt"
  >
): StudentAttemptView {
  return {
    userId: payload.userId,
    attemptId: payload.attemptId,
    type: payload.type,
    selectedAnswer: payload.selectedAnswer,
    submittedOrder: payload.submittedOrder,
    selectedPairs: payload.selectedPairs,
    transcript: payload.transcript,
    feedback: payload.feedback,
    scores: payload.scores,
    correct: payload.correct,
    createdAt: payload.createdAt
  };
}

function fromSessionAttempt(attempt: SessionAttempt): StudentAttemptView {
  return {
    userId: attempt.userId,
    attemptId: attempt.id,
    type: attempt.type,
    selectedAnswer: attempt.selectedAnswer,
    submittedOrder: attempt.submittedOrder,
    selectedPairs: attempt.selectedPairs,
    transcript: attempt.transcript,
    feedback: attempt.feedback,
    scores: attempt.scores,
    correct: attempt.correct,
    createdAt: attempt.createdAt
  };
}

type UseLessonAttemptsSyncOptions = {
  learningSessionId: string;
  lessonItemId?: string;
  roomId?: string;
  socketRef?: RefObject<Socket | null>;
  enabled: boolean;
};

/** Latest attempt per user for the current lesson item. */
export function useLessonAttemptsSync({
  learningSessionId,
  lessonItemId,
  roomId,
  socketRef,
  enabled
}: UseLessonAttemptsSyncOptions) {
  const [byUser, setByUser] = useState<Record<string, StudentAttemptView>>({});

  useEffect(() => {
    setByUser({});
    if (!enabled || !learningSessionId || !lessonItemId) return;

    let cancelled = false;
    void (async () => {
      try {
        const attempts =
          await learningSessionService.listAttempts(learningSessionId);
        if (cancelled) return;
        const next: Record<string, StudentAttemptView> = {};
        for (const attempt of attempts) {
          if (attempt.lessonItemId !== lessonItemId) continue;
          const view = fromSessionAttempt(attempt);
          const existing = next[view.userId];
          if (
            !existing ||
            new Date(view.createdAt).getTime() >
              new Date(existing.createdAt).getTime()
          ) {
            next[view.userId] = view;
          }
        }
        setByUser(next);
      } catch {
        // ignore hydrate failures
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, learningSessionId, lessonItemId]);

  useEffect(() => {
    if (!enabled || !roomId || !lessonItemId || !socketRef) return;
    const socket = socketRef.current;
    if (!socket) return;

    const onSubmitted = (payload: unknown) => {
      try {
        const parsed = parseLessonAttemptSubmittedPayload(payload);
        if (
          parsed.liveSessionRoomId !== roomId ||
          parsed.learningSessionId !== learningSessionId ||
          parsed.lessonItemId !== lessonItemId
        ) {
          return;
        }
        const view = toView(parsed);
        setByUser((prev) => ({ ...prev, [view.userId]: view }));
      } catch {
        console.warn("[realtime] invalid lesson_attempt_submitted payload");
      }
    };

    socket.on(serverEvents.lessonAttemptSubmitted, onSubmitted);
    return () => {
      socket.off(serverEvents.lessonAttemptSubmitted, onSubmitted);
    };
  }, [enabled, roomId, learningSessionId, lessonItemId, socketRef]);

  const attempts = useMemo(() => Object.values(byUser), [byUser]);

  return { attempts, byUser };
}
