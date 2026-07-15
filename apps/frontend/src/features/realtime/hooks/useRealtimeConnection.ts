"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";
import { useClassroomStore } from "@/features/classroom/store/classroomStore";
import { useCursorStore } from "@/features/classroom/store/cursorStore";
import { useParticipantControlsStore } from "@/features/classroom/store/participantControlsStore";
import { usePresenceStore } from "@/features/classroom/store/presenceStore";
import { hydrateParticipantControls } from "@/features/realtime/hooks/useParticipantControlsSync";
import { useMediaPreferencesStore } from "@/features/media/store/mediaPreferencesStore";
import { emitJoinSessionWithAck, emitLeaveSession } from "@/lib/socket/emit";
import { createSocket, disconnectSocket } from "@/lib/socket/socket";

export function useRealtimeConnection(roomId: string) {
  const socketRef = useRef<Socket | null>(null);
  const manualLeaveRef = useRef(false);
  const resetPresence = usePresenceStore((state) => state.reset);
  const resetCursor = useCursorStore((state) => state.reset);
  const resetClassroom = useClassroomStore((state) => state.reset);
  const resetParticipantControls = useParticipantControlsStore(
    (state) => state.reset
  );

  const resetAll = useCallback(() => {
    resetPresence();
    resetCursor();
    resetClassroom();
    resetParticipantControls();
  }, [
    resetPresence,
    resetCursor,
    resetClassroom,
    resetParticipantControls
  ]);

  const leaveSession = useCallback(() => {
    const socket = socketRef.current;
    if (!socket?.connected) return;

    manualLeaveRef.current = true;
    emitLeaveSession(socket, roomId);
    disconnectSocket(socket);
    socketRef.current = null;
    resetAll();
  }, [roomId, resetAll]);

  useEffect(() => {
    manualLeaveRef.current = false;
    resetAll();

    const socket = createSocket();
    socketRef.current = socket;

    const onConnect = () => {
      const microphoneEnabled =
        useMediaPreferencesStore.getState().micEnabled;
      void emitJoinSessionWithAck(socket, {
        sessionId: roomId,
        microphoneEnabled
      }).then((snapshot) => {
        if (!snapshot) return;
        hydrateParticipantControls(snapshot.participantControls);
      });
    };

    socket.on("connect", onConnect);

    return () => {
      socket.off("connect", onConnect);
      disconnectSocket(socket);
      socketRef.current = null;
      resetAll();
    };
  }, [roomId, resetAll]);

  return {
    socketRef,
    manualLeaveRef,
    leaveSession
  };
}
