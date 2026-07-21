import type { Lesson, LessonSummary, UserLessonProgress } from "@/features/lesson/types/Lesson";
import type { LessonProgressSlice } from "@/features/lesson/types/Progress";
import { EMPTY_PROGRESS, progressFromServer } from "@/features/lesson/types/Progress";

export function getProgressSlice(
  progressByLessonId: Record<string, LessonProgressSlice>,
  lessonId: string
): LessonProgressSlice {
  return progressByLessonId[lessonId] ?? EMPTY_PROGRESS;
}

export function getLessonProgressPercent(
  lesson: Lesson | LessonSummary,
  slice: LessonProgressSlice
): number {
  if (slice.status === "completed") return 100;

  if ("items" in lesson) {
    const totalItems = lesson.items.length;
    if (totalItems === 0) return 0;
    const currentItem = Math.min(
      Math.max(slice.currentItemIndex, 0),
      totalItems - 1
    );
    return Math.min(100, Math.ceil((currentItem / totalItems) * 100));
  }

  // Summary-only: coarse progress from status
  if (slice.status === "in_progress") return 50;
  return 0;
}

export function isLessonComplete(
  lesson: Lesson | LessonSummary,
  slice: LessonProgressSlice
): boolean {
  return slice.status === "completed";
}

export function getLessonCardStatus(
  lesson: LessonSummary,
  index: number,
  lessons: LessonSummary[],
  progressByLessonId: Record<string, LessonProgressSlice>
): "locked" | "available" | "in_progress" | "complete" {
  const slice = getProgressSlice(progressByLessonId, lesson.id);

  if (isLessonComplete(lesson, slice)) return "complete";

  if (index > 0) {
    const previousLesson = lessons[index - 1];
    const previousProgress = getProgressSlice(
      progressByLessonId,
      previousLesson.id
    );
    if (!isLessonComplete(previousLesson, previousProgress)) {
      return "locked";
    }
  }

  if (slice.status === "in_progress" || slice.currentItemIndex > 0) {
    return "in_progress";
  }

  return "available";
}

export function sliceFromGetLesson(
  lesson: Lesson,
  progress: UserLessonProgress
): LessonProgressSlice {
  return progressFromServer(lesson, progress);
}
