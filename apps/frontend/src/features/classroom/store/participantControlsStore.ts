import type { ParticipantControlsMap } from "@english-learning/contracts/socket/schema";
import { create } from "zustand";

type ParticipantControlsState = {
  controls: ParticipantControlsMap;
  setControls: (controls: ParticipantControlsMap) => void;
  reset: () => void;
};

export const useParticipantControlsStore = create<ParticipantControlsState>(
  (set) => ({
    controls: {},
    setControls: (controls) => set({ controls }),
    reset: () => set({ controls: {} })
  })
);
