"use client";

import { useCallback } from "react";
import type { LessonItem } from "@/features/lesson/types/Lesson";
import { useLessonStore } from "@/features/lesson/store/lessonStore";

export function useQuizSubmission(currentItem: LessonItem | undefined) {
  const quizCanProceed = useLessonStore((state) => state.quizCanProceed);
  const setQuizCanProceed = useLessonStore((state) => state.setQuizCanProceed);

  const resetSubmission = useCallback(() => {
    setQuizCanProceed(false);
  }, [setQuizCanProceed]);

  const submitQuiz = useCallback(() => {
    setQuizCanProceed(true);
  }, [setQuizCanProceed]);

  const markComplete = useCallback(() => {
    setQuizCanProceed(true);
  }, [setQuizCanProceed]);

  const isExercise = currentItem?.type === "exercise";
  const isContent = currentItem?.type === "content";

  return {
    isSubmitted: quizCanProceed && isExercise,
    canProceed: isContent ? true : quizCanProceed,
    submitQuiz,
    markComplete,
    resetSubmission,
    isExercise,
    isContent
  };
}
