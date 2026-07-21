"use client";

import { useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LessonChrome } from "@/features/lesson/components/LessonChrome";
import { LessonView } from "@/features/lesson/components/LessonView";
import { LessonListView } from "@/features/lesson/components/LessonListView";
import { useLessonStore } from "@/features/lesson/store/lessonStore";
import { useCurrentUser } from "@/features/auth/store/authStore";
import { useLearningSession } from "@/features/lesson/hooks/useLearningSession";
import { Text } from "@/components/ui";
import { learningSessionService } from "@/services/learningSessionService";
import type { RefObject } from "react";
import type { Socket } from "socket.io-client";

type LessonContainerProps = {
  lessonId?: string;
  mode?: "solo" | "classroom";
  sessionId?: string;
  socketRef?: RefObject<Socket | null>;
  selectedLessonId?: string | null;
  onSelectLesson?: (lessonId: string) => void;
  onChangeLesson?: () => void;
  onFinishDemo?: () => void;
};

export function LessonContainer({
  lessonId,
  mode = "solo",
  sessionId,
  socketRef,
  selectedLessonId = null,
  onSelectLesson,
  onChangeLesson,
  onFinishDemo
}: LessonContainerProps) {
  const resetUi = useLessonStore((state) => state.resetUi);
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();
  const isTeacher = currentUser?.role === "teacher";
  const activeLessonId = mode === "solo" ? lessonId : selectedLessonId;

  const learning = useLearningSession({
    mode,
    lessonId: activeLessonId,
    roomId: sessionId,
    socketRef,
    isTeacher,
    onClassroomLessonId: (id) => {
      if (mode !== "classroom") return;
      if (id && id !== selectedLessonId) onSelectLesson?.(id);
      if (!id && selectedLessonId) onChangeLesson?.();
    }
  });

  useEffect(() => {
    resetUi();
  }, [activeLessonId, resetUi]);

  const invalidateLessonQueries = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["course"] });
    await queryClient.invalidateQueries({ queryKey: ["lesson"] });
  }, [queryClient]);

  const leaveClassroomLesson = useCallback(async () => {
    if (mode === "classroom" && isTeacher && learning.learningSessionId) {
      try {
        await learningSessionService.end(learning.learningSessionId);
      } catch {
        // Still clear local selection so teacher is not stuck
      }
    }
    await invalidateLessonQueries();
    onChangeLesson?.();
  }, [
    mode,
    isTeacher,
    learning.learningSessionId,
    invalidateLessonQueries,
    onChangeLesson
  ]);

  const finishClassroomDemo = useCallback(async () => {
    if (mode === "classroom" && isTeacher && learning.learningSessionId) {
      try {
        await learningSessionService.end(learning.learningSessionId);
      } catch {
        // Still clear local selection
      }
    }
    await invalidateLessonQueries();
    (onFinishDemo ?? onChangeLesson)?.();
  }, [
    mode,
    isTeacher,
    learning.learningSessionId,
    invalidateLessonQueries,
    onFinishDemo,
    onChangeLesson
  ]);

  // Student receiving ended state should refresh card progress
  useEffect(() => {
    if (mode !== "classroom" || selectedLessonId) return;
    void invalidateLessonQueries();
  }, [mode, selectedLessonId, invalidateLessonQueries]);

  if (mode === "classroom" && !selectedLessonId) {
    return (
      <LessonListView
        readOnly={!isTeacher}
        onSelectLesson={
          isTeacher ? (id) => onSelectLesson?.(id) : undefined
        }
      />
    );
  }

  if (!activeLessonId) {
    return null;
  }

  if (learning.error) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Text variant="body" tone="danger">
          {learning.error}
        </Text>
      </div>
    );
  }

  if (!learning.ready || !learning.learningSessionId) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Text variant="body">Starting learning session…</Text>
      </div>
    );
  }

  const syncedItemId =
    mode === "classroom" ? learning.syncedItemId : null;
  const onSyncGoToItem =
    mode === "classroom" ? learning.setClassroomItem : undefined;

  return (
    <LessonChrome
      lessonId={activeLessonId}
      mode={mode}
      learningSessionId={learning.learningSessionId}
      syncedItemId={syncedItemId}
      onSyncGoToItem={onSyncGoToItem}
      onChangeLesson={
        mode === "classroom"
          ? isTeacher
            ? () => {
                void leaveClassroomLesson();
              }
            : undefined
          : onChangeLesson
      }
    >
      <LessonView
        lessonId={activeLessonId}
        mode={mode}
        sessionId={sessionId}
        socketRef={socketRef}
        learningSessionId={learning.learningSessionId}
        syncedItemId={syncedItemId}
        answerRevealed={
          mode === "classroom" ? learning.answerRevealed : false
        }
        onSyncGoToItem={onSyncGoToItem}
        onFinishDemo={
          mode === "classroom"
            ? isTeacher
              ? () => {
                  void finishClassroomDemo();
                }
              : undefined
            : (onFinishDemo ?? onChangeLesson)
        }
      />
    </LessonChrome>
  );
}
