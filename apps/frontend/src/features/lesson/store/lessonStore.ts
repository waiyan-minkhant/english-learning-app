import { create } from "zustand";
import { createPersist } from "@/lib/zustand/persist";

type LessonProgressSlice = {
  currentStepIndex: number;
  completedStepIds: string[];
};

type LessonState = {
  currentLessonId: string | null;
  currentStepIndex: number;
  completedStepIds: string[];
  quizCanProceed: boolean;
  progressByLessonId: Record<string, LessonProgressSlice>;

  loadLesson: (lessonId: string) => void;
  setCurrentStep: (stepIndex: number) => void;
  markStepCompleted: (stepId: string) => void;
  setQuizCanProceed: (value: boolean) => void;
  resetLessonProgress: (lessonId: string) => void;
  reset: () => void;
};

const DEFAULT_PROGRESS: LessonProgressSlice = {
  currentStepIndex: 0,
  completedStepIds: []
};

function readLegacyProgress(lessonId: string): LessonProgressSlice | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(
    `english-learning.lesson.progress.${lessonId}`
  );
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as {
      lessonId?: string;
      currentStepIndex?: number;
      completedStepIds?: string[];
    };
    if (parsed.lessonId && parsed.lessonId !== lessonId) return null;
    return {
      currentStepIndex: parsed.currentStepIndex ?? 0,
      completedStepIds: parsed.completedStepIds ?? []
    };
  } catch {
    return null;
  }
}

export const useLessonStore = create<LessonState>()(
  createPersist<LessonState>("lesson")((set, get) => ({
    currentLessonId: null,
    currentStepIndex: 0,
    completedStepIds: [],
    quizCanProceed: false,
    progressByLessonId: {},

    loadLesson: (lessonId) => {
      const saved =
        get().progressByLessonId[lessonId] ??
        readLegacyProgress(lessonId) ??
        DEFAULT_PROGRESS;

      set({
        currentLessonId: lessonId,
        currentStepIndex: saved.currentStepIndex,
        completedStepIds: saved.completedStepIds,
        quizCanProceed: false,
        progressByLessonId: {
          ...get().progressByLessonId,
          [lessonId]: saved
        }
      });
    },

    setCurrentStep: (stepIndex) => {
      const { currentLessonId, completedStepIds, progressByLessonId } = get();

      if (!currentLessonId) {
        set({ currentStepIndex: stepIndex, quizCanProceed: false });
        return;
      }

      set({
        currentStepIndex: stepIndex,
        quizCanProceed: false,
        progressByLessonId: {
          ...progressByLessonId,
          [currentLessonId]: {
            currentStepIndex: stepIndex,
            completedStepIds
          }
        }
      });
    },

    markStepCompleted: (stepId) => {
      const {
        currentLessonId,
        currentStepIndex,
        completedStepIds,
        progressByLessonId
      } = get();
      const nextCompleted = Array.from(new Set([...completedStepIds, stepId]));

      if (!currentLessonId) {
        set({ completedStepIds: nextCompleted });
        return;
      }

      set({
        completedStepIds: nextCompleted,
        progressByLessonId: {
          ...progressByLessonId,
          [currentLessonId]: {
            currentStepIndex,
            completedStepIds: nextCompleted
          }
        }
      });
    },

    setQuizCanProceed: (value) => set({ quizCanProceed: value }),

    resetLessonProgress: (lessonId) => {
      const next = {
        ...get().progressByLessonId,
        [lessonId]: DEFAULT_PROGRESS
      };

      if (get().currentLessonId === lessonId) {
        set({
          currentStepIndex: 0,
          completedStepIds: [],
          quizCanProceed: false,
          progressByLessonId: next
        });
        return;
      }

      set({ progressByLessonId: next });
    },

    reset: () =>
      set({
        currentLessonId: null,
        currentStepIndex: 0,
        completedStepIds: [],
        quizCanProceed: false
      })
  }))
);
