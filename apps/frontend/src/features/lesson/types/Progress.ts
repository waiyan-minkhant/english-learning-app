export type LessonProgress = {
  lessonId: string;
  currentStepIndex: number;
  completedStepIds: string[];
};

export type ProgressBarItem = {
  id: string;
  label: string;
  status: "completed" | "current" | "upcoming";
  kind: "exercise" | "content";
};
