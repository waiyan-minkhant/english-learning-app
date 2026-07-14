"use client";

import { useEffect, type RefObject } from "react";
import type { Socket } from "socket.io-client";
import { cursorColorForUser } from "@/features/realtime/lib/cursor";
import { isParticipantOnlineForCursor } from "@/features/classroom/lib/participantVisibility";
import { useCursorStore } from "@/features/classroom/store/cursorStore";
import { usePresenceStore } from "@/features/classroom/store/presenceStore";
import { serverEvents } from "@/lib/socket/events";
import { parseCursorMovedPayload } from "@/lib/socket/listeners";

type UseCursorOptions = {
  roomId: string;
  socketRef: RefObject<Socket | null>;
  currentUserId?: string;
};

export function useCursor({
  roomId,
  socketRef,
  currentUserId
}: UseCursorOptions) {
  const participants = usePresenceStore((state) => state.participants);
  const upsertCursor = useCursorStore((state) => state.upsertCursor);
  const updateCursorTarget = useCursorStore((state) => state.updateCursorTarget);
  const pruneCursors = useCursorStore((state) => state.pruneCursors);
  const reset = useCursorStore((state) => state.reset);

  useEffect(() => {
    reset();
  }, [roomId, reset]);

  useEffect(() => {
    pruneCursors(
      new Set(
        participants
          .filter((participant) =>
            isParticipantOnlineForCursor(participant.status)
          )
          .map((participant) => participant.userId)
      )
    );
  }, [participants, pruneCursors]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const participantById = new Map(
      participants.map((participant) => [participant.userId, participant])
    );

    const onCursorMoved = (payload: unknown) => {
      try {
        const parsed = parseCursorMovedPayload(payload);
        if (parsed.sessionId !== roomId) return;
        if (parsed.userId === currentUserId) return;

        const participant = participantById.get(parsed.userId);
        const label = participant?.name ?? "Guest";
        const existing = useCursorStore.getState().cursors[parsed.userId];

        if (!existing) {
          upsertCursor({
            userId: parsed.userId,
            x: parsed.x,
            y: parsed.y,
            targetX: parsed.x,
            targetY: parsed.y,
            label,
            color: cursorColorForUser(parsed.userId)
          });
          return;
        }

        updateCursorTarget(parsed.userId, {
          x: parsed.x,
          y: parsed.y,
          label
        });
      } catch {
        // ignore invalid payloads
      }
    };

    socket.on(serverEvents.cursorMoved, onCursorMoved);
    return () => {
      socket.off(serverEvents.cursorMoved, onCursorMoved);
    };
  }, [
    roomId,
    socketRef,
    currentUserId,
    participants,
    upsertCursor,
    updateCursorTarget
  ]);
}
