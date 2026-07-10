import { create } from "zustand";
import type { Presence } from "@/lib/socket/listeners";

type PresenceState = {
  participants: Presence[];
  setParticipants: (participants: Presence[]) => void;
  reset: () => void;
};

export const usePresenceStore = create<PresenceState>((set) => ({
  participants: [],
  setParticipants: (participants) => set({ participants }),
  reset: () => set({ participants: [] })
}));
