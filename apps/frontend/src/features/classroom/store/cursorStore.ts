import { create } from "zustand";
import { isCursorActive } from "@/features/realtime/lib/cursor";

export type RemoteCursor = {
  userId: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  label: string;
  color: string;
  lastActiveAt: number;
  isIdle: boolean;
};

type CursorInput = Omit<RemoteCursor, "lastActiveAt" | "isIdle"> & {
  lastActiveAt?: number;
  isIdle?: boolean;
};

type CursorState = {
  cursors: Record<string, RemoteCursor>;
  upsertCursor: (cursor: CursorInput) => void;
  updateCursorTarget: (
    userId: string,
    target: { x: number; y: number; label?: string }
  ) => void;
  animateCursors: () => boolean;
  tickIdleCursors: () => void;
  removeCursor: (userId: string) => void;
  pruneCursors: (userIds: Set<string>) => void;
  reset: () => void;
};

function withActivity(
  cursor: CursorInput,
  lastActiveAt = Date.now()
): RemoteCursor {
  return {
    ...cursor,
    lastActiveAt,
    isIdle: false
  };
}

export const useCursorStore = create<CursorState>((set, get) => ({
  cursors: {},

  upsertCursor: (cursor) =>
    set((state) => ({
      cursors: {
        ...state.cursors,
        [cursor.userId]: withActivity(cursor, cursor.lastActiveAt)
      }
    })),

  updateCursorTarget: (userId, target) =>
    set((state) => {
      const existing = state.cursors[userId];
      if (!existing) return state;

      return {
        cursors: {
          ...state.cursors,
          [userId]: {
            ...existing,
            targetX: target.x,
            targetY: target.y,
            label: target.label ?? existing.label,
            lastActiveAt: Date.now(),
            isIdle: false
          }
        }
      };
    }),

  animateCursors: () => {
    let dirty = false;
    const next: Record<string, RemoteCursor> = {};

    for (const [userId, cursor] of Object.entries(get().cursors)) {
      const dx = cursor.targetX - cursor.x;
      const dy = cursor.targetY - cursor.y;

      if (Math.abs(dx) > 0.0005 || Math.abs(dy) > 0.0005) {
        dirty = true;
        next[userId] = {
          ...cursor,
          x: cursor.x + dx * 0.2,
          y: cursor.y + dy * 0.2
        };
      } else {
        next[userId] = cursor;
      }
    }

    if (dirty) {
      set({ cursors: next });
    }

    return dirty;
  },

  tickIdleCursors: () => {
    const now = Date.now();
    let dirty = false;
    const next: Record<string, RemoteCursor> = {};

    for (const [userId, cursor] of Object.entries(get().cursors)) {
      const isIdle = !isCursorActive(cursor.lastActiveAt, now);
      if (cursor.isIdle !== isIdle) {
        dirty = true;
        next[userId] = { ...cursor, isIdle };
      } else {
        next[userId] = cursor;
      }
    }

    if (dirty) {
      set({ cursors: next });
    }
  },

  removeCursor: (userId) =>
    set((state) => {
      const next = { ...state.cursors };
      delete next[userId];
      return { cursors: next };
    }),

  pruneCursors: (userIds) =>
    set((state) => {
      const next: Record<string, RemoteCursor> = {};
      for (const [userId, cursor] of Object.entries(state.cursors)) {
        if (userIds.has(userId)) {
          next[userId] = cursor;
        }
      }
      return { cursors: next };
    }),

  reset: () => set({ cursors: {} })
}));
