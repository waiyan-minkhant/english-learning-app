import type { Lesson } from "@/features/lesson/types/Lesson";

export type LessonProgressSlice = {
  currentStepIndex: number;
  completedStepIds: string[];
};

const DEFAULT_PROGRESS: LessonProgressSlice = {
  currentStepIndex: 0,
  completedStepIds: []
};

export function getProgressSlice(
  progressByLessonId: Record<string, LessonProgressSlice>,
  lessonId: string
): LessonProgressSlice {
  return progressByLessonId[lessonId] ?? DEFAULT_PROGRESS;
}

export function getLessonProgressPercent(
  lesson: Lesson,
  slice: LessonProgressSlice
): number {
  const totalSteps = lesson.steps.length;
  if (totalSteps === 0) return 0;

  const currentStep = Math.min(
    Math.max(slice.currentStepIndex, 0),
    totalSteps - 1
  );

  return Math.min(100, Math.ceil((currentStep / totalSteps) * 100));
}

export function isLessonComplete(
  lesson: Lesson,
  slice: LessonProgressSlice
): boolean {
  if (lesson.steps.length === 0) return false;

  const allCompleted = lesson.steps.every((step) =>
    slice.completedStepIds.includes(step.id)
  );
  if (allCompleted) return true;

  const lastStep = lesson.steps[lesson.steps.length - 1];
  const onLastStep =
    slice.currentStepIndex >= lesson.steps.length - 1 &&
    slice.completedStepIds.includes(lastStep.id);

  return onLastStep;
}

export function isLessonUnlocked(
  lessons: Lesson[],
  index: number,
  progressByLessonId: Record<string, LessonProgressSlice>
): boolean {
  if (index <= 0) return true;

  const previousLesson = lessons[index - 1];
  if (!previousLesson) return false;

  const previousProgress = getProgressSlice(
    progressByLessonId,
    previousLesson.id
  );

  return isLessonComplete(previousLesson, previousProgress);
}

export type LessonCardStatus = "locked" | "available" | "in_progress" | "complete";

export function getLessonCardStatus(
  lesson: Lesson,
  index: number,
  lessons: Lesson[],
  progressByLessonId: Record<string, LessonProgressSlice>
): LessonCardStatus {
  if (!isLessonUnlocked(lessons, index, progressByLessonId)) {
    return "locked";
  }

  const slice = getProgressSlice(progressByLessonId, lesson.id);
  if (isLessonComplete(lesson, slice)) return "complete";

  if (slice.completedStepIds.length > 0 || slice.currentStepIndex > 0) {
    return "in_progress";
  }

  return "available";
}
