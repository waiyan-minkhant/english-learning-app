"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { LearningSession } from "@english-learning/contracts/learning-session";
import type { LessonStateUpdatedPayload } from "@english-learning/contracts/socket/schema";
import type { Socket } from "socket.io-client";
import { emitSetLessonItem } from "@/lib/socket/emit";
import { serverEvents } from "@/lib/socket/events";
import { parseLessonStateUpdatedPayload } from "@/lib/socket/listeners";
import { learningSessionService } from "@/services/learningSessionService";

type UseLearningSessionOptions = {
  mode: "solo" | "classroom";
  lessonId?: string | null;
  roomId?: string;
  socketRef?: RefObject<Socket | null>;
  isTeacher?: boolean;
  /** Classroom: called when remote state selects a lesson */
  onClassroomLessonId?: (lessonId: string | null) => void;
};

export function useLearningSession({
  mode,
  lessonId,
  roomId,
  socketRef,
  isTeacher = false,
  onClassroomLessonId
}: UseLearningSessionOptions) {
  const [session, setSession] = useState<LearningSession | null>(null);
  const [ready, setReady] = useState(mode === "classroom" && !lessonId);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const onClassroomLessonIdRef = useRef(onClassroomLessonId);
  onClassroomLessonIdRef.current = onClassroomLessonId;

  useEffect(() => {
    sessionIdRef.current = session?.id ?? null;
  }, [session?.id]);

  // Solo: start session when lesson is available; end on unmount / lesson change
  useEffect(() => {
    if (mode !== "solo" || !lessonId) return;

    let cancelled = false;
    setReady(false);
    setError(null);

    void (async () => {
      try {
        const created = await learningSessionService.startSolo(lessonId);
        if (cancelled) {
          void learningSessionService.end(created.id).catch(() => undefined);
          return;
        }
        setSession(created);
        setReady(true);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to start learning session"
          );
          setReady(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      const id = sessionIdRef.current;
      if (id) {
        void learningSessionService.end(id).catch(() => undefined);
      }
      setSession(null);
      setReady(false);
    };
  }, [mode, lessonId]);

  // Classroom teacher: create session when a lesson is selected
  useEffect(() => {
    if (mode !== "classroom" || !isTeacher || !lessonId || !roomId) return;

    let cancelled = false;
    setReady(false);
    setError(null);

    void (async () => {
      try {
        const created = await learningSessionService.startClassroom({
          lessonId,
          roomId
        });
        if (cancelled) return;
        setSession(created);
        setReady(true);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to start classroom learning session"
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mode, isTeacher, lessonId, roomId]);

  // Classroom students (and teachers after create): sync from socket + hydrate active session
  useEffect(() => {
    if (mode !== "classroom" || !roomId) return;

    let cancelled = false;

    void (async () => {
      try {
        const sessions = await learningSessionService.list({
          roomId,
          status: "live",
          mode: "classroom"
        });
        if (cancelled) return;
        const active = sessions[0] ?? null;
        if (active) {
          setSession(active);
          setReady(true);
          onClassroomLessonIdRef.current?.(active.lessonId);
        } else if (!isTeacher) {
          setReady(true);
        }
      } catch {
        if (!cancelled && !isTeacher) setReady(true);
      }
    })();

    const socket = socketRef?.current;
    if (!socket) return;

    const onState = (payload: unknown) => {
      try {
        const parsed = parseLessonStateUpdatedPayload(payload);
        if (parsed.liveSessionRoomId !== roomId) return;
        if (parsed.status === "ended") {
          setSession(null);
          onClassroomLessonIdRef.current?.(null);
          return;
        }
        setSession((prev) => ({
          id: parsed.learningSessionId,
          mode: "classroom",
          status: parsed.status,
          lessonId: parsed.lessonId,
          currentLessonItemId: parsed.currentLessonItemId,
          answerRevealed: parsed.answerRevealed,
          startedById: prev?.startedById ?? "",
          liveSessionId: prev?.liveSessionId ?? null,
          liveSessionRoomId: parsed.liveSessionRoomId,
          startedAt: prev?.startedAt ?? new Date().toISOString(),
          endedAt: null
        }));
        setReady(true);
        onClassroomLessonIdRef.current?.(parsed.lessonId);
      } catch {
        console.warn("[realtime] invalid lesson_state_updated payload");
      }
    };

    socket.on(serverEvents.lessonStateUpdated, onState);
    return () => {
      cancelled = true;
      socket.off(serverEvents.lessonStateUpdated, onState);
    };
  }, [mode, roomId, socketRef, isTeacher]);

  const setClassroomItem = useCallback(
    (itemId: string) => {
      if (!session || !roomId || !socketRef?.current) return;
      emitSetLessonItem(socketRef.current, {
        sessionId: roomId,
        learningSessionId: session.id,
        lessonId: session.lessonId,
        itemId
      });
      setSession((prev) =>
        prev
          ? {
              ...prev,
              currentLessonItemId: itemId,
              answerRevealed: false
            }
          : prev
      );
    },
    [session, roomId, socketRef]
  );

  const applyRemoteState = useCallback((state: LessonStateUpdatedPayload) => {
    setSession((prev) => ({
      id: state.learningSessionId,
      mode: "classroom",
      status: state.status,
      lessonId: state.lessonId,
      currentLessonItemId: state.currentLessonItemId,
      answerRevealed: state.answerRevealed,
      startedById: prev?.startedById ?? "",
      liveSessionId: prev?.liveSessionId ?? null,
      liveSessionRoomId: state.liveSessionRoomId,
      startedAt: prev?.startedAt ?? new Date().toISOString(),
      endedAt: null
    }));
  }, []);

  return {
    learningSession: session,
    learningSessionId: session?.id ?? null,
    syncedItemId: session?.currentLessonItemId ?? null,
    answerRevealed: session?.answerRevealed ?? false,
    ready,
    error,
    setClassroomItem,
    applyRemoteState
  };
}
