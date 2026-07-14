"use client";

import { useCallback, useEffect, type RefObject } from "react";
import type { Socket } from "socket.io-client";
import type {
  ParticipantControls,
  ParticipantControlsMap
} from "@english-learning/contracts/socket/schema";
import { useParticipantControlsStore } from "@/features/classroom/store/participantControlsStore";
import {
  emitUpdateBulkParticipantControls,
  emitUpdateParticipantControls
} from "@/lib/socket/emit";
import { serverEvents } from "@/lib/socket/events";
import { parseParticipantControlsUpdatedPayload } from "@/lib/socket/listeners";

export type ParticipantControlsActions = {
  updateParticipantControls: (
    userId: string,
    patch: Partial<ParticipantControls>
  ) => void;
  updateBulkParticipantControls: (
    patch: Partial<ParticipantControls>
  ) => void;
};

export function hydrateParticipantControls(
  participantControls: ParticipantControlsMap
) {
  useParticipantControlsStore.getState().setControls(participantControls);
}

export function useParticipantControlsSync(
  roomId: string,
  socketRef: RefObject<Socket | null>
): ParticipantControlsActions {
  const setControls = useParticipantControlsStore((state) => state.setControls);
  const resetControls = useParticipantControlsStore((state) => state.reset);

  useEffect(() => {
    resetControls();
  }, [roomId, resetControls]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const onParticipantControlsUpdated = (payload: unknown) => {
      try {
        const parsed = parseParticipantControlsUpdatedPayload(payload);
        if (parsed.sessionId === roomId) {
          setControls(parsed.participantControls);
        }
      } catch {
        console.warn("[realtime] invalid participant_controls_updated payload");
      }
    };

    socket.on(
      serverEvents.participantControlsUpdated,
      onParticipantControlsUpdated
    );

    return () => {
      socket.off(
        serverEvents.participantControlsUpdated,
        onParticipantControlsUpdated
      );
    };
  }, [roomId, socketRef, setControls]);

  const updateParticipantControls = useCallback(
    (userId: string, patch: Partial<ParticipantControls>) => {
      const socket = socketRef.current;
      if (!socket?.connected) return;
      emitUpdateParticipantControls(socket, {
        sessionId: roomId,
        userId,
        ...patch
      });
    },
    [roomId, socketRef]
  );

  const updateBulkParticipantControls = useCallback(
    (patch: Partial<ParticipantControls>) => {
      const socket = socketRef.current;
      if (!socket?.connected) return;
      emitUpdateBulkParticipantControls(socket, {
        sessionId: roomId,
        target: "all_students",
        ...patch
      });
    },
    [roomId, socketRef]
  );

  return {
    updateParticipantControls,
    updateBulkParticipantControls
  };
}
