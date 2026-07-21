"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useQuizSubmission } from "@/features/lesson/hooks/useQuizSubmission";
import {
  getLessonProgressPercent,
  sliceFromGetLesson
} from "@/features/lesson/lib/lessonProgress";
import { useLessonStore } from "@/features/lesson/store/lessonStore";
import type { ProgressBarItem } from "@/features/lesson/types/Progress";
import { lessonService } from "@/services/lessonService";

type LessonViewModelOptions = {
  mode?: "solo" | "classroom";
  learningSessionId?: string | null;
  /** Classroom sync cursor — when set, drives item index instead of progress/preview */
  syncedItemId?: string | null;
  onSyncGoToItem?: (itemId: string) => void;
};

export function useLessonViewModel(
  lessonId: string,
  options: LessonViewModelOptions = {}
) {
  const {
    mode = "solo",
    learningSessionId = null,
    syncedItemId = null,
    onSyncGoToItem
  } = options;
  const previewItemIndex = useLessonStore((state) => state.previewItemIndex);
  const setPreviewItemIndex = useLessonStore(
    (state) => state.setPreviewItemIndex
  );
  const setQuizCanProceed = useLessonStore((state) => state.setQuizCanProceed);
  const queryClient = useQueryClient();

  const lessonQuery = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => lessonService.getLesson(lessonId),
    enabled: !!lessonId,
    refetchOnWindowFocus: false
  });

  const lesson = lessonQuery.data?.lesson;
  const progress = lessonQuery.data?.progress;
  const serverSlice =
    lesson && progress ? sliceFromGetLesson(lesson, progress) : null;

  const syncedIndex =
    lesson && syncedItemId
      ? lesson.items.findIndex((item) => item.id === syncedItemId)
      : -1;

  // Solo: local cursor from 0 (ignore shared class progress). Classroom: sync / server.
  const itemIndex =
    mode === "classroom" && syncedIndex >= 0
      ? syncedIndex
      : mode === "solo"
        ? (previewItemIndex ?? 0)
        : (previewItemIndex ??
          (lesson
            ? Math.min(
                Math.max(serverSlice?.currentItemIndex ?? 0, 0),
                lesson.items.length - 1
              )
            : 0));
  const currentItem = lesson?.items[itemIndex];
  const quiz = useQuizSubmission(currentItem);

  return useMemo(() => {
    const progressBarItems: ProgressBarItem[] =
      lesson?.items.map((item, index) => {
        const status =
          index < itemIndex
            ? "completed"
            : index === itemIndex
              ? "current"
              : "upcoming";

        return {
          id: item.id,
          label: item.title,
          status,
          kind: item.type
        };
      }) ?? [];

    const progressPercent = lesson
      ? getLessonProgressPercent(lesson, {
          currentItemIndex: itemIndex,
          completedItemIds: [],
          // Solo pill tracks replay cursor; don't short-circuit on class "completed"
          status:
            mode === "solo"
              ? "in_progress"
              : (serverSlice?.status ?? "not_started")
        })
      : 0;

    const isFirstItem = itemIndex === 0;
    const isLastItem = lesson ? itemIndex >= lesson.items.length - 1 : true;
    const listTitle = lesson
      ? `Lesson ${lesson.number} : ${lesson.title}`
      : "";

    async function invalidateLesson() {
      await queryClient.invalidateQueries({ queryKey: ["lesson", lessonId] });
      setQuizCanProceed(false);
    }

    async function refetchLesson() {
      await invalidateLesson();
      setPreviewItemIndex(null);
    }

    async function advanceSoloCursor() {
      if (!lesson) return;
      const next = Math.min(itemIndex + 1, lesson.items.length - 1);
      setPreviewItemIndex(next);
      setQuizCanProceed(false);
    }

    async function goNext() {
      if (!lesson || !currentItem || !learningSessionId) return;

      // Solo: local cursor only — never mutate shared class progress.
      if (mode === "solo") {
        if (currentItem.type === "exercise" && !quiz.canProceed) return;
        await advanceSoloCursor();
        return;
      }

      if (currentItem.type === "content") {
        await lessonService.completeContentItem(
          lessonId,
          currentItem.id,
          learningSessionId
        );
        await refetchLesson();
        return;
      }

      if (!quiz.canProceed) return;
      await refetchLesson();
    }

    function goToItem(index: number) {
      if (!lesson) return;
      const clamped = Math.max(0, Math.min(index, lesson.items.length - 1));
      const target = lesson.items[clamped];
      if (!target) return;

      if (mode === "classroom" && onSyncGoToItem) {
        onSyncGoToItem(target.id);
        setQuizCanProceed(false);
        return;
      }

      setPreviewItemIndex(clamped);
      setQuizCanProceed(false);
    }

    return {
      lessonTitle: lesson?.title ?? "",
      listTitle,
      lessonDescription: lesson?.description ?? "",
      progressPercent,
      progressBarItems,
      currentItemTitle: currentItem?.title ?? "",
      canGoNext: quiz.canProceed,
      canGoBack: !isFirstItem,
      nextButtonLabel: isLastItem
        ? quiz.isExercise && !quiz.canProceed
          ? "Complete exercise"
          : "Finish lesson"
        : "Continue",
      showSidebar: false,
      compactLayout: mode === "classroom",
      itemIndex,
      currentItem,
      learningSessionId,
      onNext: () => {
        void goNext();
      },
      onBack: () => {
        goToItem(itemIndex - 1);
      },
      onGoToItem: goToItem,
      onMarkContentRead: quiz.markComplete,
      onReset: () => {
        setPreviewItemIndex(mode === "solo" ? 0 : null);
        setQuizCanProceed(false);
        void queryClient.invalidateQueries({ queryKey: ["lesson", lessonId] });
      },
      refetchLesson,
      isLoading: lessonQuery.isLoading,
      error: lessonQuery.error
    };
  }, [
    lesson,
    lessonId,
    serverSlice,
    itemIndex,
    currentItem,
    quiz,
    mode,
    learningSessionId,
    onSyncGoToItem,
    lessonQuery.isLoading,
    lessonQuery.error,
    queryClient,
    setPreviewItemIndex,
    setQuizCanProceed
  ]);
}

export type LessonViewModel = ReturnType<typeof useLessonViewModel>;
