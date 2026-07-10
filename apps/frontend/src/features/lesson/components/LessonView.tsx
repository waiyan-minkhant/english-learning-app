"use client";

import { useQuery } from "@tanstack/react-query";
import { Button, Text } from "@/components/ui";
import { useLessonViewModel } from "@/features/lesson/hooks/useLessonViewModel";
import { Footer } from "@/features/lesson/components/Footer";
import { ProgressBar } from "@/features/lesson/components/ProgressBar";
import { Sidebar } from "@/features/lesson/components/Sidebar";
import { StepRenderer } from "@/features/lesson/components/StepRenderer";
import { useQuizSubmission } from "@/features/lesson/hooks/useQuizSubmission";
import { lessonService } from "@/services/lessonService";
import { cn } from "@/utils/cn";

type LessonViewProps = {
  lessonId: string;
  mode?: "solo" | "classroom";
  onChangeLesson?: () => void;
};

export function LessonView({
  lessonId,
  mode = "solo",
  onChangeLesson
}: LessonViewProps) {
  const lessonQuery = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => lessonService.getLesson(lessonId),
    enabled: !!lessonId
  });

  const viewModel = useLessonViewModel(lessonId, { mode });
  const quiz = useQuizSubmission(viewModel.currentStep);

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
        "flex h-full min-h-0 flex-col bg-background",
        viewModel.compactLayout && "bg-transparent"
      )}
    >
      <div className="flex min-h-0 flex-1">
        {viewModel.showSidebar ? <Sidebar lessonId={lessonId} /> : null}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header
            className={cn(
              "border-b border-border bg-surface py-4",
              mode === "classroom" ? "px-10" : "px-6"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <Text variant="title" size="title-20" as="h1">
                  {viewModel.lessonTitle}
                </Text>
                <Text variant="body">{viewModel.lessonDescription}</Text>
              </div>
              {mode === "classroom" && onChangeLesson ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={onChangeLesson}
                  className="shrink-0"
                >
                  Change lesson
                </Button>
              ) : null}
            </div>
            <div className="mt-4">
              <ProgressBar
                lessonId={lessonId}
                compact={viewModel.compactLayout}
              />
            </div>
          </header>

          <div
            className={cn(
              "min-h-0 flex-1 overflow-y-auto py-6",
              mode === "classroom" ? "px-10" : "px-6"
            )}
          >
            <Text variant="label" tone="muted" className="mb-4">
              {viewModel.currentStepTitle}
            </Text>
            {viewModel.currentStep ? (
              <StepRenderer
                step={viewModel.currentStep}
                onExerciseComplete={quiz.markComplete}
                onContentRead={quiz.markComplete}
              />
            ) : null}
          </div>

          {!viewModel.compactLayout ? <Footer lessonId={lessonId} /> : null}
        </div>
      </div>
    </div>
  );
}
