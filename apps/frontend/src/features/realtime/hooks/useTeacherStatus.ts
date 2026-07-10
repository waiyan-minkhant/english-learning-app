"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import type { Socket } from "socket.io-client";
import { useClassroomStore } from "@/features/classroom/store/classroomStore";
import { clientEvents, serverEvents } from "@/lib/socket/events";
import { emitEndSession } from "@/lib/socket/emit";
import {
  parseSessionEndedPayload,
  parseSocketErrorPayload,
  parseTeacherOfflinePayload
} from "@/lib/socket/listeners";

const TEACHER_OFFLINE_COUNTDOWN_SECONDS = 5;

type UseTeacherStatusOptions = {
  roomId: string;
  socketRef: RefObject<Socket | null>;
  onSessionEnded: () => void;
};

export function useTeacherStatus({
  roomId,
  socketRef,
  onSessionEnded
}: UseTeacherStatusOptions) {
  const teacherOfflineCountdown = useClassroomStore(
    (state) => state.teacherOfflineCountdown
  );
  const setCountdown = useClassroomStore((state) => state.setCountdown);
  const tickCountdown = useClassroomStore((state) => state.tickCountdown);
  const setRoomId = useClassroomStore((state) => state.setRoomId);

  const onSessionEndedRef = useRef(onSessionEnded);
  onSessionEndedRef.current = onSessionEnded;

  const handleSessionEnded = useCallback(() => {
    setCountdown(null);
    onSessionEndedRef.current();
  }, [setCountdown]);

  useEffect(() => {
    setRoomId(roomId);
    setCountdown(null);
  }, [roomId, setRoomId, setCountdown]);

  useEffect(() => {
    if (teacherOfflineCountdown === null) return;

    if (teacherOfflineCountdown <= 0) {
      handleSessionEnded();
      return;
    }

    const timerId = window.setTimeout(() => {
      tickCountdown();
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [teacherOfflineCountdown, handleSessionEnded, tickCountdown]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const onTeacherOffline = (payload: unknown) => {
      try {
        const parsed = parseTeacherOfflinePayload(payload);
        if (parsed.sessionId === roomId) {
          setCountdown(TEACHER_OFFLINE_COUNTDOWN_SECONDS);
        }
      } catch {
        console.warn("[realtime] invalid teacher_offline payload");
      }
    };

    const onSessionEnded = (payload: unknown) => {
      const parsed = parseSessionEndedPayload(payload);
      if (parsed.sessionId === roomId) {
        handleSessionEnded();
      }
    };

    const onSocketError = (payload: unknown) => {
      try {
        const parsed = parseSocketErrorPayload(payload);
        if (
          parsed.request === clientEvents.joinSession &&
          parsed.code === "SESSION_NOT_LIVE"
        ) {
          handleSessionEnded();
        }
      } catch {
        console.warn("[realtime] invalid socket_error payload");
      }
    };

    socket.on(serverEvents.teacherOffline, onTeacherOffline);
    socket.on(serverEvents.sessionEnded, onSessionEnded);
    socket.on(serverEvents.socketError, onSocketError);

    return () => {
      socket.off(serverEvents.teacherOffline, onTeacherOffline);
      socket.off(serverEvents.sessionEnded, onSessionEnded);
      socket.off(serverEvents.socketError, onSocketError);
    };
  }, [roomId, socketRef, handleSessionEnded, setCountdown]);

  const endClass = useCallback(() => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    emitEndSession(socket, roomId);
  }, [roomId, socketRef]);

  return { endClass };
}
