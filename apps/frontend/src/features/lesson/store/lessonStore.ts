import { create } from "zustand";

type LessonUiState = {
  quizCanProceed: boolean;
  /** Teacher/dev preview override; null = follow server progress. */
  previewItemIndex: number | null;
  setQuizCanProceed: (value: boolean) => void;
  setPreviewItemIndex: (index: number | null) => void;
  resetUi: () => void;
};

export const useLessonStore = create<LessonUiState>((set) => ({
  quizCanProceed: false,
  previewItemIndex: null,
  setQuizCanProceed: (value) => set({ quizCanProceed: value }),
  setPreviewItemIndex: (index) => set({ previewItemIndex: index }),
  resetUi: () => set({ quizCanProceed: false, previewItemIndex: null })
}));
