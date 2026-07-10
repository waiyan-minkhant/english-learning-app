"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useCurrentStep } from "@/features/lesson/hooks/useCurrentStep";
import { useLessonNavigation } from "@/features/lesson/hooks/useLessonNavigation";
import { useQuizSubmission } from "@/features/lesson/hooks/useQuizSubmission";
import { useLessonStore } from "@/features/lesson/store/lessonStore";
import { lessonService } from "@/services/lessonService";

export function useLesson(lessonId: string) {
  const loadLesson = useLessonStore((state) => state.loadLesson);
  const currentLessonId = useLessonStore((state) => state.currentLessonId);
  const currentStepIndex = useLessonStore((state) => state.currentStepIndex);
  const completedStepIds = useLessonStore((state) => state.completedStepIds);

  const lessonQuery = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => lessonService.getLesson(lessonId),
    enabled: !!lessonId
  });

  useEffect(() => {
    if (lessonId) {
      loadLesson(lessonId);
    }
  }, [lessonId, loadLesson]);

  const current = useCurrentStep(lessonQuery.data);
  const navigation = useLessonNavigation(lessonQuery.data);
  const quiz = useQuizSubmission(current.step);

  useEffect(() => {
    quiz.resetSubmission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.step?.id]);

  return {
    lesson: lessonQuery.data,
    isLoading: lessonQuery.isLoading,
    error: lessonQuery.error,
    progress: {
      lessonId: currentLessonId ?? lessonId,
      currentStepIndex,
      completedStepIds
    },
    currentStep: current.step,
    stepIndex: current.stepIndex,
    isFirstStep: current.isFirst,
    isLastStep: current.isLast,
    navigation,
    quiz
  };
}

export type LessonState = ReturnType<typeof useLesson>;
