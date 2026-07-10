"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";
import { useClassroomStore } from "@/features/classroom/store/classroomStore";
import { useCursorStore } from "@/features/classroom/store/cursorStore";
import { usePresenceStore } from "@/features/classroom/store/presenceStore";
import { emitJoinSession, emitLeaveSession } from "@/lib/socket/emit";
import { createSocket, disconnectSocket } from "@/lib/socket/socket";

export function useRealtimeConnection(roomId: string) {
  const socketRef = useRef<Socket | null>(null);
  const manualLeaveRef = useRef(false);
  const resetPresence = usePresenceStore((state) => state.reset);
  const resetCursor = useCursorStore((state) => state.reset);
  const resetClassroom = useClassroomStore((state) => state.reset);

  const leaveSession = useCallback(() => {
    const socket = socketRef.current;
    if (!socket?.connected) return;

    manualLeaveRef.current = true;
    emitLeaveSession(socket, roomId);
    disconnectSocket(socket);
    socketRef.current = null;
    resetPresence();
    resetCursor();
    resetClassroom();
  }, [roomId, resetPresence, resetCursor, resetClassroom]);

  useEffect(() => {
    manualLeaveRef.current = false;
    resetPresence();
    resetCursor();
    resetClassroom();

    const socket = createSocket();
    socketRef.current = socket;

    const onConnect = () => {
      emitJoinSession(socket, roomId);
    };

    socket.on("connect", onConnect);

    return () => {
      socket.off("connect", onConnect);
      disconnectSocket(socket);
      socketRef.current = null;
      resetPresence();
      resetCursor();
      resetClassroom();
    };
  }, [roomId, resetPresence, resetCursor, resetClassroom]);

  return {
    socketRef,
    manualLeaveRef,
    leaveSession
  };
}
