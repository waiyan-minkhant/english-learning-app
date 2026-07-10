import { create } from "zustand";
import { createPersist } from "@/lib/zustand/persist";

type UiState = {
  classroomSidebarOpen: boolean;
  setClassroomSidebarOpen: (open: boolean) => void;
  toggleClassroomSidebar: () => void;
};

export const useUiStore = create<UiState>()(
  createPersist<UiState>("ui")((set) => ({
    classroomSidebarOpen: true,
    setClassroomSidebarOpen: (open) => set({ classroomSidebarOpen: open }),
    toggleClassroomSidebar: () =>
      set((state) => ({
        classroomSidebarOpen: !state.classroomSidebarOpen
      }))
  }))
);
