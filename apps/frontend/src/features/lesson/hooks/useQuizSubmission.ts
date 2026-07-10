"use client";

import { useCallback } from "react";
import type { Step } from "@/features/lesson/types/Lesson";
import { useLessonStore } from "@/features/lesson/store/lessonStore";

export function useQuizSubmission(currentStep: Step | undefined) {
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

  const isExercise = currentStep?.type === "exercise";
  const isContent = currentStep?.type === "content";

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
