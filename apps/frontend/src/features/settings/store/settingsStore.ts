import { create } from "zustand";
import { createPersist } from "@/lib/zustand/persist";

type Theme = "light" | "dark";
type Language = "en";

type SettingsState = {
  theme: Theme;
  language: Language;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
};

export const useSettingsStore = create<SettingsState>()(
  createPersist<SettingsState>("settings")((set) => ({
    theme: "light",
    language: "en",
    setTheme: (theme) => set({ theme }),
    setLanguage: (language) => set({ language })
  }))
);
