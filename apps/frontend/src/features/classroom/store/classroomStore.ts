import { create } from "zustand";

type ClassroomState = {
  roomId: string | null;
  teacherOfflineCountdown: number | null;
  activeTool: string | null;
  setRoomId: (roomId: string | null) => void;
  setCountdown: (seconds: number | null) => void;
  tickCountdown: () => void;
  setActiveTool: (tool: string | null) => void;
  reset: () => void;
};

export const useClassroomStore = create<ClassroomState>((set, get) => ({
  roomId: null,
  teacherOfflineCountdown: null,
  activeTool: null,

  setRoomId: (roomId) => set({ roomId }),

  setCountdown: (seconds) => set({ teacherOfflineCountdown: seconds }),

  tickCountdown: () => {
    const current = get().teacherOfflineCountdown;
    if (current === null) return;
    set({ teacherOfflineCountdown: current - 1 });
  },

  setActiveTool: (tool) => set({ activeTool: tool }),

  reset: () =>
    set({
      roomId: null,
      teacherOfflineCountdown: null,
      activeTool: null
    })
}));
