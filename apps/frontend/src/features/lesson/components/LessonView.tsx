"use client";

import { useQuery } from "@tanstack/react-query";
import { Text } from "@/components/ui";
import { useLessonViewModel } from "@/features/lesson/hooks/useLessonViewModel";
import { Footer } from "@/features/lesson/components/Footer";
import { LessonDevNav } from "@/features/lesson/components/LessonDevNav";
import { StepRenderer } from "@/features/lesson/components/StepRenderer";
import { useQuizSubmission } from "@/features/lesson/hooks/useQuizSubmission";
import { lessonService } from "@/services/lessonService";
import { cn } from "@/utils/cn";

type LessonViewProps = {
  lessonId: string;
  mode?: "solo" | "classroom";
};

export function LessonView({ lessonId, mode = "solo" }: LessonViewProps) {
  const lessonQuery = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => lessonService.getLesson(lessonId),
    enabled: !!lessonId
  });

  const viewModel = useLessonViewModel(lessonId, { mode });
  const quiz = useQuizSubmission(viewModel.currentStep);
  const isConversationStep =
    viewModel.currentStep?.type === "exercise" &&
    viewModel.currentStep.exerciseType === "conversation";

  if (lessonQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Text variant="body">Loading lesson…</Text>
      </div>
    );
  }

  if (lessonQuery.error instanceof Error) {
    return (
      <div className="flex h-full items-center justify-center">
        <Text variant="body" tone="danger">
          {lessonQuery.error.message}
        </Text>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 flex-col bg-surface",
        viewModel.compactLayout && "bg-transparent"
      )}
    >
      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto",
          mode === "classroom"
            ? "px-10 pb-6 pt-20"
            : "px-5 pb-8 pt-10 sm:px-10"
        )}
      >
        {viewModel.currentStep ? (
          <StepRenderer
            step={viewModel.currentStep}
            onExerciseComplete={quiz.markComplete}
            onContentRead={quiz.markComplete}
          />
        ) : null}
      </div>

      {!viewModel.compactLayout &&
      !(isConversationStep && !quiz.canProceed) ? (
        <Footer lessonId={lessonId} />
      ) : null}

      {process.env.NODE_ENV === "development" ? (
        <LessonDevNav
          stepIndex={viewModel.stepIndex}
          stepCount={viewModel.progressBarItems.length}
          onPrev={() => viewModel.onGoToStep(viewModel.stepIndex - 1)}
          onNext={() => viewModel.onGoToStep(viewModel.stepIndex + 1)}
        />
      ) : null}
    </div>
  );
}
