"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getLessonCardStatus,
  getLessonProgressPercent,
  getProgressSlice
} from "@/features/lesson/lib/lessonProgress";
import { useLessonStore } from "@/features/lesson/store/lessonStore";
import type { Lesson } from "@/features/lesson/types/Lesson";
import { lessonService } from "@/services/lessonService";

export type LessonListItem = {
  lesson: Lesson;
  status: ReturnType<typeof getLessonCardStatus>;
  progressPercent: number;
  displayTitle: string;
  displayDescription: string;
  number: number;
};

export function useLessonListViewModel() {
  const progressByLessonId = useLessonStore((state) => state.progressByLessonId);

  const courseQuery = useQuery({
    queryKey: ["course"],
    queryFn: () => lessonService.getCourse()
  });

  const items = useMemo((): LessonListItem[] => {
    const lessons = courseQuery.data?.lessons ?? [];

    return lessons.map((lesson, index) => {
      const slice = getProgressSlice(progressByLessonId, lesson.id);
      const status = getLessonCardStatus(
        lesson,
        index,
        lessons,
        progressByLessonId
      );
      const progressPercent =
        status === "complete"
          ? 100
          : getLessonProgressPercent(lesson, slice);

      return {
        lesson,
        status,
        progressPercent,
        displayTitle: lesson.listTitle ?? lesson.title,
        displayDescription: lesson.description,
        number: lesson.number ?? index + 1
      };
    });
  }, [courseQuery.data?.lessons, progressByLessonId]);

  return {
    welcomeTitle:
      courseQuery.data?.welcomeTitle ??
      `Hello! Welcome to ${courseQuery.data?.title ?? "English Class"}`,
    welcomeSubtitle:
      courseQuery.data?.welcomeSubtitle ??
      "Which lesson are we tackling today?",
    items,
    isLoading: courseQuery.isLoading,
    error: courseQuery.error
  };
}
