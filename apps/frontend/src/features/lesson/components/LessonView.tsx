"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { RefObject } from "react";
import type { Socket } from "socket.io-client";
import { Text } from "@/components/ui";
import { useCurrentUser } from "@/features/auth/store/authStore";
import { useParticipantControls } from "@/features/classroom/hooks/useParticipantControls";
import { AnswerReveal } from "@/features/lesson/components/AnswerReveal";
import { useLessonViewModel } from "@/features/lesson/hooks/useLessonViewModel";
import { Footer } from "@/features/lesson/components/Footer";
import { LessonDevNav } from "@/features/lesson/components/LessonDevNav";
import { ItemRenderer } from "@/features/lesson/components/ItemRenderer";
import { getItemAnswerKey } from "@/features/lesson/lib/getItemAnswerKey";
import { useQuizSubmission } from "@/features/lesson/hooks/useQuizSubmission";
import { useLessonRevealSync } from "@/features/realtime/hooks/useLessonRevealSync";
import { useLessonAttemptsSync } from "@/features/realtime/hooks/useLessonAttemptsSync";
import { lessonService } from "@/services/lessonService";
import { cn } from "@/utils/cn";

type LessonViewProps = {
  lessonId: string;
  mode?: "solo" | "classroom";
  sessionId?: string;
  socketRef?: RefObject<Socket | null>;
  learningSessionId: string;
  syncedItemId?: string | null;
  answerRevealed?: boolean;
  onSyncGoToItem?: (itemId: string) => void;
  onFinishDemo?: () => void;
};

export function LessonView({
  lessonId,
  mode = "solo",
  sessionId,
  socketRef,
  learningSessionId,
  syncedItemId = null,
  answerRevealed: remoteAnswerRevealed = false,
  onSyncGoToItem,
  onFinishDemo
}: LessonViewProps) {
  const router = useRouter();
  const lessonQuery = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => lessonService.getLesson(lessonId),
    enabled: !!lessonId,
    refetchOnWindowFocus: false
  });

  const currentUser = useCurrentUser();
  const { cursorEnabled } = useParticipantControls();
  const viewModel = useLessonViewModel(lessonId, {
    mode,
    learningSessionId,
    syncedItemId,
    onSyncGoToItem
  });
  const quiz = useQuizSubmission(viewModel.currentItem);
  const isConversationItem =
    viewModel.currentItem?.type === "exercise" &&
    viewModel.currentItem.exerciseType === "conversation";
  const isDemoCompleteItem =
    viewModel.currentItem?.type === "content" &&
    viewModel.currentItem.contentType === "demo_complete";
  const lessonTitle = lessonQuery.data?.lesson.title ?? "Lesson";
  const isTeacher = currentUser?.role === "teacher";
  const interactionsLocked =
    mode === "classroom" && !isTeacher && !cursorEnabled;
  const itemId = viewModel.currentItem?.id;
  const answerKey = viewModel.currentItem
    ? getItemAnswerKey(viewModel.currentItem)
    : null;

  const { publishReveal, revealSignal } = useLessonRevealSync({
    sessionId,
    learningSessionId,
    lessonId,
    itemId,
    socketRef,
    enabled: mode === "classroom" && Boolean(sessionId),
    remoteAnswerRevealed
  });

  const { attempts: studentAttempts } = useLessonAttemptsSync({
    learningSessionId,
    lessonItemId: itemId,
    roomId: sessionId,
    socketRef,
    enabled: mode === "classroom" && isTeacher && Boolean(sessionId)
  });

  const sharedAttempt = useMemo(() => {
    if (!isTeacher || mode !== "classroom") return null;
    if (studentAttempts.length === 0) return null;
    return [...studentAttempts].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0]!;
  }, [isTeacher, mode, studentAttempts]);

  const teacherReadOnly = mode === "classroom" && isTeacher;

  const [answersRevealed, setAnswersRevealed] = useState(false);
  const lastRevealSignalRef = useRef(revealSignal);

  useEffect(() => {
    setAnswersRevealed(false);
    lastRevealSignalRef.current = 0;
  }, [itemId]);

  useEffect(() => {
    if (revealSignal <= lastRevealSignalRef.current) return;
    lastRevealSignalRef.current = revealSignal;
    setAnswersRevealed(true);
  }, [revealSignal]);

  function handleRevealAnswers() {
    setAnswersRevealed(true);
    publishReveal();
  }

  async function handleFinishDemo() {
    // Classroom: ending the session marks the lesson complete for all participants
    // when the cursor is on the last item. Solo never mutates shared progress.
    if (onFinishDemo) {
      onFinishDemo();
      return;
    }

    router.push("/dashboard");
  }

  if (lessonQuery.isLoading || viewModel.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Text variant="body">Loading lesson…</Text>
      </div>
    );
  }

  if (lessonQuery.error instanceof Error) {
    return (
      <div className="flex h-full items-center justify-center">
        <Text variant="body" tone="danger">
          {lessonQuery.error.message}
        </Text>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 flex-col bg-surface",
        viewModel.compactLayout && "bg-transparent"
      )}
    >
      <div
        className={cn(
          "relative min-h-0 flex-1 overflow-y-auto",
          mode === "classroom"
            ? "px-10 pb-6 pt-20"
            : "px-5 pb-8 pt-10 sm:px-10"
        )}
      >
        {viewModel.currentItem ? (
          <div className="relative">
            <ItemRenderer
              item={viewModel.currentItem}
              lessonId={lessonId}
              lessonTitle={lessonTitle}
              learningSessionId={learningSessionId}
              onExerciseComplete={quiz.markComplete}
              onContentRead={quiz.markComplete}
              onFinishDemo={
                onFinishDemo
                  ? () => {
                      void handleFinishDemo();
                    }
                  : undefined
              }
              exerciseDisabled={interactionsLocked}
              teacherReadOnly={teacherReadOnly}
              sharedAttempt={sharedAttempt}
            />
            {answerKey ? (
              <AnswerReveal
                answerKey={answerKey}
                revealed={answersRevealed}
                canReveal={isTeacher}
                onReveal={handleRevealAnswers}
              />
            ) : null}
          </div>
        ) : null}
      </div>

      {!viewModel.compactLayout &&
      !isDemoCompleteItem &&
      !(isConversationItem && !quiz.canProceed) ? (
        <Footer
          lessonId={lessonId}
          learningSessionId={learningSessionId}
          mode={mode}
          syncedItemId={syncedItemId}
          onSyncGoToItem={onSyncGoToItem}
        />
      ) : null}

      {mode === "solo" || isTeacher ? (
        <LessonDevNav
          stepIndex={viewModel.itemIndex}
          stepCount={viewModel.progressBarItems.length}
          onPrev={() => viewModel.onGoToItem(viewModel.itemIndex - 1)}
          onNext={() => viewModel.onGoToItem(viewModel.itemIndex + 1)}
        />
      ) : null}
    </div>
  );
}
