"use client";

import { useEffect } from "react";
import { LessonView } from "@/features/lesson/components/LessonView";
import { LessonListView } from "@/features/lesson/components/LessonListView";
import { useLessonStore } from "@/features/lesson/store/lessonStore";

type LessonContainerProps = {
  lessonId?: string;
  mode?: "solo" | "classroom";
  selectedLessonId?: string | null;
  onSelectLesson?: (lessonId: string) => void;
  onChangeLesson?: () => void;
};

export function LessonContainer({
  lessonId,
  mode = "solo",
  selectedLessonId = null,
  onSelectLesson,
  onChangeLesson
}: LessonContainerProps) {
  const loadLesson = useLessonStore((state) => state.loadLesson);
  const activeLessonId = mode === "solo" ? lessonId : selectedLessonId;

  useEffect(() => {
    if (activeLessonId) {
      loadLesson(activeLessonId);
    }
  }, [activeLessonId, loadLesson]);

  if (mode === "classroom" && !selectedLessonId) {
    return (
      <LessonListView onSelectLesson={(id) => onSelectLesson?.(id)} />
    );
  }

  if (!activeLessonId) {
    return null;
  }

  return (
    <LessonView
      lessonId={activeLessonId}
      mode={mode}
      onChangeLesson={onChangeLesson}
    />
  );
}
