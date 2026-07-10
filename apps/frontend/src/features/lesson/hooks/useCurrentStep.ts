"use client";

import { useMemo } from "react";
import type { Lesson, Step } from "@/features/lesson/types/Lesson";
import { useLessonStore } from "@/features/lesson/store/lessonStore";

export function useCurrentStep(lesson: Lesson | undefined) {
  const currentStepIndex = useLessonStore((state) => state.currentStepIndex);

  return useMemo(() => {
    if (!lesson) {
      return {
        step: undefined as Step | undefined,
        stepIndex: 0,
        isFirst: true,
        isLast: true
      };
    }

    const stepIndex = Math.min(
      Math.max(currentStepIndex, 0),
      lesson.steps.length - 1
    );
    const step = lesson.steps[stepIndex];

    return {
      step,
      stepIndex,
      isFirst: stepIndex === 0,
      isLast: stepIndex === lesson.steps.length - 1
    };
  }, [lesson, currentStepIndex]);
}
