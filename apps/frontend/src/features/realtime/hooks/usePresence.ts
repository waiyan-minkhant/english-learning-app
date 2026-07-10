"use client";

import { useEffect, type RefObject } from "react";
import type { Socket } from "socket.io-client";
import { usePresenceStore } from "@/features/classroom/store/presenceStore";
import {
  parsePresenceUpdatedPayload
} from "@/lib/socket/listeners";
import { serverEvents } from "@/lib/socket/events";

export function usePresence(
  roomId: string,
  socketRef: RefObject<Socket | null>
) {
  const setParticipants = usePresenceStore((state) => state.setParticipants);
  const reset = usePresenceStore((state) => state.reset);

  useEffect(() => {
    reset();
  }, [roomId, reset]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const onPresenceUpdated = (payload: unknown) => {
      try {
        const parsed = parsePresenceUpdatedPayload(payload);
        if (parsed.sessionId === roomId) {
          setParticipants(parsed.participants);
        }
      } catch {
        console.warn("[realtime] invalid presence_updated payload");
      }
    };

    socket.on(serverEvents.presenceUpdated, onPresenceUpdated);
    return () => {
      socket.off(serverEvents.presenceUpdated, onPresenceUpdated);
    };
  }, [roomId, socketRef, setParticipants]);
}
