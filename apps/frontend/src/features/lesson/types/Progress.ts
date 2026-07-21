import type { Lesson, UserLessonProgress } from "@/features/lesson/types/Lesson";

export type LessonProgressSlice = {
  currentItemIndex: number;
  completedItemIds: string[];
  status: UserLessonProgress["status"];
};

export const EMPTY_PROGRESS: LessonProgressSlice = {
  currentItemIndex: 0,
  completedItemIds: [],
  status: "not_started"
};

export function progressFromServer(
  lesson: Lesson,
  progress: UserLessonProgress
): LessonProgressSlice {
  const index = progress.currentItemId
    ? Math.max(
        0,
        lesson.items.findIndex((item) => item.id === progress.currentItemId)
      )
    : 0;

  const completedItemIds =
    progress.status === "completed"
      ? lesson.items.map((item) => item.id)
      : lesson.items.slice(0, index).map((item) => item.id);

  return {
    currentItemIndex: index === -1 ? 0 : index,
    completedItemIds,
    status: progress.status
  };
}

export type ProgressBarItemStatus = "completed" | "current" | "upcoming";

export type ProgressBarItem = {
  id: string;
  label: string;
  status: ProgressBarItemStatus;
  kind: "exercise" | "content";
};
