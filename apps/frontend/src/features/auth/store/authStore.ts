import { create } from "zustand";
import type { SessionUser } from "@/features/auth/lib/auth";
import { createPersist } from "@/lib/zustand/persist";

type AuthState = {
  user: SessionUser | null;
  setUser: (user: SessionUser) => void;
  clearUser: () => void;
};

export const useAuthStore = create<AuthState>()(
  createPersist<AuthState>("auth")((set) => ({
    user: null,
    setUser: (user) => set({ user }),
    clearUser: () => set({ user: null })
  }))
);

export function useCurrentUser() {
  return useAuthStore((state) => state.user);
}
