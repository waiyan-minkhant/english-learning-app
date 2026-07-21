"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Text } from "@/components/ui";
import { LessonCard } from "@/features/lesson/components/LessonCard";
import { useLessonListViewModel } from "@/features/lesson/hooks/useLessonListViewModel";
import { useLessonStore } from "@/features/lesson/store/lessonStore";
import { lessonService } from "@/services/lessonService";
import { cn } from "@/utils/cn";

type LessonListViewProps = {
  onSelectLesson?: (lessonId: string) => void;
  readOnly?: boolean;
  /** Solo practice: only completed lessons can be opened */
  onlyCompletedSelectable?: boolean;
};

const isDev = process.env.NODE_ENV === "development";

export function LessonListView({
  onSelectLesson,
  readOnly = false,
  onlyCompletedSelectable = false
}: LessonListViewProps) {
  const queryClient = useQueryClient();
  const resetUi = useLessonStore((state) => state.resetUi);
  const { welcomeTitle, welcomeSubtitle, items, isLoading, error } =
    useLessonListViewModel();
  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);

  async function handleClearProgress() {
    const confirmed = window.confirm(
      "Clear ALL lesson progress, attempts, and learning sessions for every user? This cannot be undone."
    );
    if (!confirmed) return;

    setClearing(true);
    setClearError(null);
    try {
      await lessonService.resetAllProgressDev();
      resetUi();
      await queryClient.invalidateQueries({ queryKey: ["course"] });
      await queryClient.invalidateQueries({ queryKey: ["lesson"] });
    } catch (err) {
      setClearError(
        err instanceof Error ? err.message : "Failed to clear progress"
      );
    } finally {
      setClearing(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Text variant="body">Loading lessons…</Text>
      </div>
    );
  }

  if (error instanceof Error) {
    return (
      <div className="flex h-full items-center justify-center">
        <Text variant="body" tone="danger">
          {error.message}
        </Text>
      </div>
    );
  }

  const subtitle = readOnly
    ? "Waiting for your teacher to choose a lesson."
    : onlyCompletedSelectable
      ? "Practice lessons you have already completed in class."
      : welcomeSubtitle;

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-y-auto px-12 py-8",
        readOnly && "select-none"
      )}
    >
      <header
        className={cn("mb-8", readOnly && "pointer-events-none")}
        aria-disabled={readOnly || undefined}
      >
        <Text variant="heading" as="h1" className="text-primary">
          {welcomeTitle}
        </Text>
        <Text variant="body" tone="muted" className="mt-2">
          {subtitle}
        </Text>
      </header>

      {isDev ? (
        <div className="mb-6 flex flex-col items-start gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={clearing}
            onClick={() => {
              void handleClearProgress();
            }}
          >
            {clearing ? "Clearing…" : "Clear all progress (dev)"}
          </Button>
          {clearError ? (
            <Text variant="caption" tone="danger">
              {clearError}
            </Text>
          ) : null}
        </div>
      ) : null}

      <div
        className={cn(
          "grid flex-1 gap-4 sm:grid-cols-2",
          readOnly && "pointer-events-none"
        )}
      >
        {items.map((item) => (
          <LessonCard
            key={item.lesson.id}
            item={item}
            onlyCompletedSelectable={onlyCompletedSelectable}
            onSelect={readOnly ? undefined : onSelectLesson}
          />
        ))}
      </div>
    </div>
  );
}
