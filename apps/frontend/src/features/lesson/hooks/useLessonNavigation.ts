"use client";

import { useCallback } from "react";
import type { Lesson } from "@/features/lesson/types/Lesson";
import { useLessonStore } from "@/features/lesson/store/lessonStore";

export function useLessonNavigation(lesson: Lesson | undefined) {
  const currentStepIndex = useLessonStore((state) => state.currentStepIndex);
  const setCurrentStep = useLessonStore((state) => state.setCurrentStep);
  const markStepCompleted = useLessonStore((state) => state.markStepCompleted);
  const resetLessonProgress = useLessonStore(
    (state) => state.resetLessonProgress
  );

  const goToStep = useCallback(
    (stepIndex: number) => {
      if (!lesson) return;
      const clamped = Math.min(
        Math.max(stepIndex, 0),
        lesson.steps.length - 1
      );
      setCurrentStep(clamped);
    },
    [lesson, setCurrentStep]
  );

  const goNext = useCallback(() => {
    if (!lesson) return;

    const step = lesson.steps[currentStepIndex];
    if (step) {
      markStepCompleted(step.id);
    }

    if (currentStepIndex >= lesson.steps.length - 1) {
      return;
    }

    setCurrentStep(currentStepIndex + 1);
  }, [lesson, currentStepIndex, markStepCompleted, setCurrentStep]);

  const goBack = useCallback(() => {
    goToStep(currentStepIndex - 1);
  }, [goToStep, currentStepIndex]);

  const resetProgress = useCallback(() => {
    if (!lesson) return;
    resetLessonProgress(lesson.id);
    setCurrentStep(0);
  }, [lesson, resetLessonProgress, setCurrentStep]);

  return { goNext, goBack, goToStep, resetProgress };
}
