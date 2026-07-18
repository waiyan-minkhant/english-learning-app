"use client";

import { useEffect } from "react";
import { LessonChrome } from "@/features/lesson/components/LessonChrome";
import { LessonView } from "@/features/lesson/components/LessonView";
import { LessonListView } from "@/features/lesson/components/LessonListView";
import { useLessonStore } from "@/features/lesson/store/lessonStore";

type LessonContainerProps = {
  lessonId?: string;
  mode?: "solo" | "classroom";
  sessionId?: string;
  selectedLessonId?: string | null;
  onSelectLesson?: (lessonId: string) => void;
  onChangeLesson?: () => void;
};

export function LessonContainer({
  lessonId,
  mode = "solo",
  sessionId,
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
    <LessonChrome
      lessonId={activeLessonId}
      mode={mode}
      onChangeLesson={onChangeLesson}
    >
      <LessonView
        lessonId={activeLessonId}
        mode={mode}
        sessionId={sessionId}
      />
    </LessonChrome>
  );
}
