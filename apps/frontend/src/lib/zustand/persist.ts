import { createJSONStorage, persist, type PersistOptions } from "zustand/middleware";
import type { StateCreator } from "zustand";

const STORAGE_PREFIX = "english-learning";

export function persistKey(name: string) {
  return `${STORAGE_PREFIX}.${name}`;
}

export function createPersist<T>(
  name: string,
  options?: Omit<PersistOptions<T>, "name" | "storage">
) {
  return (config: StateCreator<T, [["zustand/persist", unknown]], []>) =>
    persist(config, {
      name: persistKey(name),
      storage: createJSONStorage(() => localStorage),
      ...options
    });
}
