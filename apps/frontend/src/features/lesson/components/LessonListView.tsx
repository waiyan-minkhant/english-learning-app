"use client";

import { Text } from "@/components/ui";
import { LessonCard } from "@/features/lesson/components/LessonCard";
import { useLessonListViewModel } from "@/features/lesson/hooks/useLessonListViewModel";

type LessonListViewProps = {
  onSelectLesson: (lessonId: string) => void;
};

export function LessonListView({ onSelectLesson }: LessonListViewProps) {
  const { welcomeTitle, welcomeSubtitle, items, isLoading, error } =
    useLessonListViewModel();

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

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto px-12 py-8">
      <header className="mb-8">
        <Text variant="heading" as="h1" className="text-primary">
          {welcomeTitle}
        </Text>
        <Text variant="body" tone="muted" className="mt-2">
          {welcomeSubtitle}
        </Text>
      </header>

      <div className="grid flex-1 gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <LessonCard
            key={item.lesson.id}
            item={item}
            onSelect={onSelectLesson}
          />
        ))}
      </div>
    </div>
  );
}
