"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent
} from "@dnd-kit/core";
import { Text } from "@/components/ui";
import { PuzzleAnswerPiece } from "@/features/lesson/exercises/matching/PuzzleAnswerPiece";
import { PuzzleDropSlot } from "@/features/lesson/exercises/matching/PuzzleDropSlot";
import { PuzzleQuestionCap } from "@/features/lesson/exercises/matching/PuzzleQuestionCap";
import { PUZZLE } from "@/features/lesson/exercises/matching/puzzleGeometry";
import { cn } from "@/utils/cn";

const BANK_ID = "bank";
const REVEAL_DELAY_MS = 500;

const PAIRS = [
  { question: "What is your name?", answer: "My name is David." },
  { question: "Where are you from?", answer: "I'm from Myanmar." },
  { question: "What do you do?", answer: "I am a student." }
] as const;

type MatchingExerciseProps = {
  title?: string;
  onComplete: () => void;
  disabled?: boolean;
};

type DragData = {
  answer: string;
  fromQuestion: string | null;
};

function shuffleAnswers(answers: readonly string[]): string[] {
  const next = [...answers];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = next[i]!;
    next[i] = next[j]!;
    next[j] = tmp;
  }
  return next;
}

function isBoardComplete(placements: Record<string, string>): boolean {
  return PAIRS.every((pair) => Boolean(placements[pair.question]));
}

function isBoardCorrect(placements: Record<string, string>): boolean {
  return PAIRS.every((pair) => placements[pair.question] === pair.answer);
}

function DraggableAnswer({
  answer,
  fromQuestion,
  disabled,
  status,
  className
}: {
  answer: string;
  fromQuestion: string | null;
  disabled?: boolean;
  status?: "success" | "error";
  className?: string;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: answer,
    data: { answer, fromQuestion } satisfies DragData,
    disabled
  });

  return (
    <PuzzleAnswerPiece
      ref={setNodeRef}
      dragging={isDragging}
      status={status}
      className={cn(
        disabled
          ? "cursor-default"
          : "cursor-grab active:cursor-grabbing",
        className
      )}
      {...listeners}
      {...attributes}
    >
      {answer}
    </PuzzleAnswerPiece>
  );
}

function DroppableSlot({
  question,
  disabled
}: {
  question: string;
  disabled?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: question,
    disabled
  });

  return (
    <PuzzleDropSlot
      ref={setNodeRef}
      highlighted={isOver}
      aria-label={`Drop zone for: ${question}`}
    />
  );
}

function DroppableBank({
  children,
  disabled
}: {
  children: ReactNode;
  disabled?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: BANK_ID,
    disabled
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[108px] w-full flex-wrap items-start justify-center gap-5 rounded-xl p-2 transition-colors",
        isOver && !disabled && "bg-brand-background/60"
      )}
    >
      {children}
    </div>
  );
}

export function MatchingExercise({
  title = "Matching",
  onComplete,
  disabled
}: MatchingExerciseProps) {
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [bankOrder, setBankOrder] = useState<string[]>(() =>
    PAIRS.map((p) => p.answer)
  );
  const [activeAnswer, setActiveAnswer] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [pendingReveal, setPendingReveal] = useState(false);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completedRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 }
    }),
    useSensor(KeyboardSensor)
  );

  const locked = Boolean(disabled || revealed || pendingReveal);

  useEffect(() => {
    setBankOrder(shuffleAnswers(PAIRS.map((p) => p.answer)));
  }, []);

  useEffect(() => {
    return () => {
      if (revealTimeoutRef.current) {
        clearTimeout(revealTimeoutRef.current);
      }
    };
  }, []);

  const placedAnswers = new Set(Object.values(placements));
  const bankAnswers = bankOrder.filter((answer) => !placedAnswers.has(answer));

  function questionForAnswer(answer: string): string | undefined {
    return Object.entries(placements).find(([, a]) => a === answer)?.[0];
  }

  function scheduleReveal(nextPlacements: Record<string, string>) {
    setPendingReveal(true);
    if (revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current);
    }
    revealTimeoutRef.current = setTimeout(() => {
      setRevealed(true);
      setPendingReveal(false);
      if (isBoardCorrect(nextPlacements) && !completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
    }, REVEAL_DELAY_MS);
  }

  function handleDragStart(event: DragStartEvent) {
    if (locked) return;
    setActiveAnswer(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveAnswer(null);

    if (locked || !over) return;

    const answer = String(active.id);
    const overId = String(over.id);
    const data = active.data.current as DragData | undefined;
    const fromQuestion =
      data?.fromQuestion ?? questionForAnswer(answer) ?? null;

    if (overId === BANK_ID) {
      if (!fromQuestion) return;
      setPlacements((current) => {
        const next = { ...current };
        delete next[fromQuestion];
        return next;
      });
      return;
    }

    // Target is a question slot — only empty slots accept drops
    if (placements[overId] && placements[overId] !== answer) return;

    const next: Record<string, string> = { ...placements };
    if (fromQuestion) {
      delete next[fromQuestion];
    }
    next[overId] = answer;
    setPlacements(next);

    if (isBoardComplete(next)) {
      scheduleReveal(next);
    }
  }

  function handleDragCancel() {
    setActiveAnswer(null);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-10 pt-2 sm:gap-14">
        <Text
          variant="heading"
          size="title-20"
          tone="primary"
          weight="bold"
          className="text-center"
        >
          {title}
        </Text>

        <div className="flex w-full flex-wrap items-start justify-center gap-5">
          {PAIRS.map((pair) => {
            const placed = placements[pair.question];
            const status =
              revealed && placed
                ? placed === pair.answer
                  ? "success"
                  : "error"
                : undefined;

            return (
              <div key={pair.question} className="w-[200px] shrink-0">
                <PuzzleQuestionCap>{pair.question}</PuzzleQuestionCap>
                <div
                  className="relative z-10"
                  style={{ marginTop: `-${PUZZLE.tabRadius}px` }}
                >
                  {placed ? (
                    <DraggableAnswer
                      answer={placed}
                      fromQuestion={pair.question}
                      disabled={locked}
                      status={status}
                    />
                  ) : (
                    <DroppableSlot
                      question={pair.question}
                      disabled={locked}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <DroppableBank disabled={locked}>
          {bankAnswers.map((answer) => (
            <div key={answer} className="w-[200px] shrink-0">
              <DraggableAnswer
                answer={answer}
                fromQuestion={null}
                disabled={locked}
              />
            </div>
          ))}
        </DroppableBank>
      </div>

      {typeof document !== "undefined"
        ? createPortal(
            <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
              {activeAnswer ? (
                <div className="w-[200px]">
                  <PuzzleAnswerPiece selected>{activeAnswer}</PuzzleAnswerPiece>
                </div>
              ) : null}
            </DragOverlay>,
            document.body
          )
        : null}
    </DndContext>
  );
}
