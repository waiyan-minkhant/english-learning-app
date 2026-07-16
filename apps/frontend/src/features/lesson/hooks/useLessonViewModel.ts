"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useLessonNavigation } from "@/features/lesson/hooks/useLessonNavigation";
import { useQuizSubmission } from "@/features/lesson/hooks/useQuizSubmission";
import {
  getLessonProgressPercent,
  getProgressSlice
} from "@/features/lesson/lib/lessonProgress";
import { useLessonStore } from "@/features/lesson/store/lessonStore";
import type { ProgressBarItem } from "@/features/lesson/types/Progress";
import { lessonService } from "@/services/lessonService";

type LessonViewModelOptions = {
  mode?: "solo" | "classroom";
};

export function useLessonViewModel(
  lessonId: string,
  options: LessonViewModelOptions = {}
) {
  const { mode = "solo" } = options;
  const currentStepIndex = useLessonStore((state) => state.currentStepIndex);
  const progressByLessonId = useLessonStore(
    (state) => state.progressByLessonId
  );

  const lessonQuery = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => lessonService.getLesson(lessonId),
    enabled: !!lessonId
  });

  const lesson = lessonQuery.data;
  const navigation = useLessonNavigation(lesson);
  const stepIndex = lesson
    ? Math.min(Math.max(currentStepIndex, 0), lesson.steps.length - 1)
    : 0;
  const currentStep = lesson?.steps[stepIndex];
  const quiz = useQuizSubmission(currentStep);

  return useMemo(() => {
    const progressBarItems: ProgressBarItem[] =
      lesson?.steps.map((step, index) => {
        const status =
          index < stepIndex
            ? "completed"
            : index === stepIndex
              ? "current"
              : "upcoming";

        return {
          id: step.id,
          label: step.title ?? `Step ${index + 1}`,
          status,
          kind: step.type
        };
      }) ?? [];

    const progressSlice = getProgressSlice(progressByLessonId, lessonId);
    const progressPercent = lesson
      ? getLessonProgressPercent(lesson, progressSlice)
      : 0;

    const currentStepTitle =
      currentStep?.title ??
      (currentStep?.type === "exercise" ? "Exercise" : "Lesson content");

    const isFirstStep = stepIndex === 0;
    const isLastStep = lesson ? stepIndex >= lesson.steps.length - 1 : true;
    const canGoNext = quiz.canProceed;
    const canGoBack = !isFirstStep;
    const nextButtonLabel = isLastStep
      ? quiz.isExercise && !quiz.canProceed
        ? "Complete exercise"
        : "Finish lesson"
      : "Continue";

    const listTitle =
      lesson?.listTitle ??
      (lesson?.number != null
        ? `Lesson ${lesson.number} : ${lesson.title}`
        : (lesson?.title ?? ""));

    return {
      lessonTitle: lesson?.title ?? "",
      listTitle,
      lessonDescription: lesson?.description ?? "",
      progressPercent,
      progressBarItems,
      currentStepTitle,
      canGoNext,
      canGoBack,
      nextButtonLabel,
      showSidebar: false,
      compactLayout: mode === "classroom",
      stepIndex,
      currentStep,
      onNext: () => {
        if (quiz.isExercise && !quiz.canProceed) {
          quiz.submitQuiz();
          return;
        }
        navigation.goNext();
      },
      onBack: navigation.goBack,
      onGoToStep: navigation.goToStep,
      onMarkContentRead: quiz.markComplete,
      onReset: navigation.resetProgress
    };
  }, [
    lesson,
    lessonId,
    progressByLessonId,
    stepIndex,
    currentStep,
    quiz,
    navigation,
    mode
  ]);
}

export type LessonViewModel = ReturnType<typeof useLessonViewModel>;
