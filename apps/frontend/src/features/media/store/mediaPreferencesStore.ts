import { create } from "zustand";

export type MediaPermission = "unknown" | "granted" | "denied";

type MediaPreferencesState = {
  micEnabled: boolean;
  camEnabled: boolean;
  permission: MediaPermission;
  setMicEnabled: (enabled: boolean) => void;
  setCamEnabled: (enabled: boolean) => void;
  setPermission: (permission: MediaPermission) => void;
  toggleMic: () => void;
  toggleCam: () => void;
};

export const useMediaPreferencesStore = create<MediaPreferencesState>(
  (set) => ({
    micEnabled: false,
    camEnabled: false,
    permission: "unknown",
    setMicEnabled: (micEnabled) => set({ micEnabled }),
    setCamEnabled: (camEnabled) => set({ camEnabled }),
    setPermission: (permission) => set({ permission }),
    toggleMic: () => set((state) => ({ micEnabled: !state.micEnabled })),
    toggleCam: () => set((state) => ({ camEnabled: !state.camEnabled }))
  })
);
