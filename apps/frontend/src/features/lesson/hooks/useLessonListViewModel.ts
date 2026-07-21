"use client";

import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  getLessonCardStatus,
  getLessonProgressPercent,
  sliceFromGetLesson
} from "@/features/lesson/lib/lessonProgress";
import type { LessonSummary } from "@/features/lesson/types/Lesson";
import type { LessonProgressSlice } from "@/features/lesson/types/Progress";
import { EMPTY_PROGRESS } from "@/features/lesson/types/Progress";
import { lessonService } from "@/services/lessonService";

export type LessonListItem = {
  lesson: LessonSummary;
  status: ReturnType<typeof getLessonCardStatus>;
  progressPercent: number;
  displayTitle: string;
  displayDescription: string;
  number: number;
};

export function useLessonListViewModel() {
  const courseQuery = useQuery({
    queryKey: ["course", lessonService.getDefaultCourseId()],
    queryFn: () => lessonService.getCourse()
  });

  const lessons = courseQuery.data?.lessons ?? [];

  const progressQueries = useQueries({
    queries: lessons.map((lesson) => ({
      queryKey: ["lesson", lesson.id],
      queryFn: () => lessonService.getLesson(lesson.id),
      enabled: lessons.length > 0
    }))
  });

  const progressByLessonId = useMemo(() => {
    const map: Record<string, LessonProgressSlice> = {};
    lessons.forEach((lesson, index) => {
      const data = progressQueries[index]?.data;
      if (data) {
        map[lesson.id] = sliceFromGetLesson(data.lesson, data.progress);
      } else {
        map[lesson.id] = EMPTY_PROGRESS;
      }
    });
    return map;
  }, [lessons, progressQueries]);

  const items = useMemo((): LessonListItem[] => {
    return lessons.map((lesson, index) => {
      const slice = progressByLessonId[lesson.id] ?? EMPTY_PROGRESS;
      const status = getLessonCardStatus(
        lesson,
        index,
        lessons,
        progressByLessonId
      );
      const fullLesson = progressQueries[index]?.data?.lesson;
      const progressPercent =
        status === "complete"
          ? 100
          : getLessonProgressPercent(fullLesson ?? lesson, slice);

      return {
        lesson,
        status,
        progressPercent,
        displayTitle: `Lesson ${lesson.number} : ${lesson.title}`,
        displayDescription: lesson.description,
        number: lesson.number
      };
    });
  }, [lessons, progressByLessonId, progressQueries]);

  return {
    welcomeTitle: courseQuery.data
      ? `Hello! Welcome to ${courseQuery.data.title}`
      : "Hello! Welcome to English Class",
    welcomeSubtitle:
      courseQuery.data?.description ??
      "Which lesson are we tackling today?",
    items,
    isLoading: courseQuery.isLoading,
    error: courseQuery.error
  };
}
