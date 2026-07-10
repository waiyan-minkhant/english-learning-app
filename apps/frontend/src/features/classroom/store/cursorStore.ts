import { create } from "zustand";

export type RemoteCursor = {
  userId: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  label: string;
  color: string;
};

type CursorState = {
  cursors: Record<string, RemoteCursor>;
  upsertCursor: (cursor: RemoteCursor) => void;
  updateCursorTarget: (
    userId: string,
    target: { x: number; y: number; label?: string }
  ) => void;
  animateCursors: () => boolean;
  removeCursor: (userId: string) => void;
  pruneCursors: (userIds: Set<string>) => void;
  reset: () => void;
};

export const useCursorStore = create<CursorState>((set, get) => ({
  cursors: {},

  upsertCursor: (cursor) =>
    set((state) => ({
      cursors: { ...state.cursors, [cursor.userId]: cursor }
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
            label: target.label ?? existing.label
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
