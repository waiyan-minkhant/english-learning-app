"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Text } from "@/components/ui";
import { SpeakerIcon } from "@/components/icons";
import { useAudioPlayer } from "@/features/lesson/hooks/useAudioPlayer";
import { lessonService } from "@/services/lessonService";
import type { StudentAttemptView } from "@/features/realtime/hooks/useLessonAttemptsSync";
import { cn } from "@/utils/cn";

const DEFAULT_TITLE = "Listen and build sentence";
const REVEAL_DELAY_MS = 500;

type ListenBuildExerciseProps = {
  lessonItemId: string;
  learningSessionId: string;
  title?: string;
  audioUrl?: string;
  words?: string[];
  correctOrder?: string[];
  onComplete: () => void;
  disabled?: boolean;
  sharedAttempt?: StudentAttemptView | null;
};

function usedFlagsForBuilt(wordList: string[], built: string[]): boolean[] {
  const used = wordList.map(() => false);
  const consumed = new Set<number>();
  for (const word of built) {
    const index = wordList.findIndex((w, i) => w === word && !consumed.has(i));
    if (index === -1) continue;
    used[index] = true;
    consumed.add(index);
  }
  return used;
}

export function ListenBuildExercise({
  lessonItemId,
  learningSessionId,
  title = DEFAULT_TITLE,
  audioUrl,
  words,
  correctOrder,
  onComplete,
  disabled,
  sharedAttempt = null
}: ListenBuildExerciseProps) {
  const hasData = Boolean(words?.length) && Boolean(correctOrder?.length);

  const wordList = words ?? [];
  const order = correctOrder ?? [];

  const [built, setBuilt] = useState<string[]>([]);
  const [used, setUsed] = useState<boolean[]>(() => wordList.map(() => false));
  const [revealed, setRevealed] = useState(false);
  const [pendingReveal, setPendingReveal] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const completedRef = useRef(false);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { play, error: playError } = useAudioPlayer();

  const mirrored = Boolean(sharedAttempt?.submittedOrder?.length);
  const displayBuilt = mirrored
    ? (sharedAttempt!.submittedOrder ?? [])
    : built;
  const displayUsed = useMemo(
    () =>
      mirrored ? usedFlagsForBuilt(wordList, displayBuilt) : used,
    [mirrored, wordList, displayBuilt, used]
  );
  const displayRevealed = mirrored ? true : revealed;

  const locked =
    disabled || hasCompleted || pendingReveal || mirrored || displayRevealed;

  useEffect(() => {
    setUsed(wordList.map(() => false));
    setBuilt([]);
    setRevealed(false);
    setPendingReveal(false);
    setHasCompleted(false);
    completedRef.current = false;
  }, [wordList.join("\0")]);

  useEffect(() => {
    return () => {
      if (revealTimeoutRef.current) {
        clearTimeout(revealTimeoutRef.current);
      }
    };
  }, []);

  if (!hasData) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col items-center pt-2">
        <Text variant="body" tone="danger">
          Listen-and-build-sentence data is missing from the lesson.
        </Text>
      </div>
    );
  }

  function clearRevealTimeout() {
    if (revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }
  }

  function addWord(word: string, index: number) {
    if (locked || completedRef.current || used[index] || revealed || mirrored)
      return;

    const nextBuilt = [...built, word];
    const nextUsed = used.map((isUsed, i) => (i === index ? true : isUsed));

    setBuilt(nextBuilt);
    setUsed(nextUsed);

    if (nextBuilt.length === order.length) {
      setPendingReveal(true);
      clearRevealTimeout();

      revealTimeoutRef.current = setTimeout(() => {
        setRevealed(true);
        setPendingReveal(false);

        const isCorrect = nextBuilt.every((w, i) => w === order[i]);
        if (!completedRef.current) {
          if (isCorrect) {
            completedRef.current = true;
            setHasCompleted(true);
          }
          void lessonService
            .submitListenBuildAttempt(
              lessonItemId,
              learningSessionId,
              nextBuilt
            )
            .then(() => {
              if (isCorrect) onComplete();
            })
            .catch(() => {
              if (isCorrect) {
                completedRef.current = false;
                setHasCompleted(false);
              }
            });
        }
      }, REVEAL_DELAY_MS);
    }
  }

  function removeWord(index: number) {
    if (disabled || hasCompleted || pendingReveal || mirrored) return;

    const word = built[index];
    if (!word) return;

    const bankIndex = wordList.findIndex((w, i) => w === word && used[i]);
    if (bankIndex === -1) return;

    clearRevealTimeout();
    setRevealed(false);
    setBuilt(built.filter((_, i) => i !== index));
    setUsed((prev) =>
      prev.map((isUsed, i) => (i === bankIndex ? false : isUsed))
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-10 pt-2">
      <div className="flex flex-col items-center gap-2">
        <Text
          variant="heading"
          size="title-20"
          tone="primary"
          weight="bold"
          className="text-center"
        >
          {title}
        </Text>
      </div>

      <div className="flex w-full items-center gap-4 rounded-xl bg-gradient-to-b from-locked-gradient-from to-locked-gradient-to px-5 py-5 sm:px-6">
        <button
          type="button"
          aria-label="Play audio"
          disabled={!audioUrl}
          onClick={() => {
            if (audioUrl) void play(audioUrl);
          }}
          className={cn(
            "pointer-events-auto relative z-30 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_4px_12px_rgb(255_103_21_/_0.35)] transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            audioUrl
              ? "hover:opacity-90"
              : "cursor-default opacity-40"
          )}
        >
          <SpeakerIcon size={22} className="text-primary-foreground" />
        </button>

        <div className="flex min-h-[2.5rem] flex-1 flex-col justify-end">
          <div className="flex min-h-[2rem] flex-wrap items-end gap-2">
            {displayBuilt.map((word, index) => {
              const isPositionCorrect = word === order[index];
              const showResult = displayRevealed;

              return (
                <button
                  key={`${word}-${index}`}
                  type="button"
                  disabled={locked}
                  onClick={() => removeWord(index)}
                  className={cn(
                    "rounded-lg px-4 py-2 text-body-16 font-semibold shadow-sm transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    "disabled:pointer-events-none",
                    showResult &&
                      isPositionCorrect &&
                      "bg-success text-primary-foreground shadow-[0_6px_16px_rgb(0_204_68_/_0.35)]",
                    showResult &&
                      !isPositionCorrect &&
                      "bg-danger text-primary-foreground shadow-[0_6px_16px_rgb(204_0_0_/_0.3)]",
                    !showResult && "bg-surface text-foreground"
                  )}
                >
                  {word}
                </button>
              );
            })}
          </div>
          <span
            className="mt-1 w-full border-b border-dashed border-muted-foreground"
            aria-hidden
          />
        </div>
      </div>

      <div className="mt-6 flex w-full flex-wrap justify-center gap-3">
        {wordList.map((word, index) => {
          const isUsed = displayUsed[index];
          const bankLocked = locked || displayRevealed || isUsed;

          return (
            <button
              key={`${word}-${index}`}
              type="button"
              disabled={bankLocked}
              onClick={() => addWord(word, index)}
              aria-label={isUsed ? undefined : word}
              className={cn(
                "rounded-xl bg-muted px-5 py-3 text-body-16 font-semibold shadow-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                "disabled:pointer-events-none disabled:opacity-100",
                isUsed ? "text-muted" : "text-foreground",
                !bankLocked && "hover:bg-muted/80"
              )}
            >
              {word}
            </button>
          );
        })}
      </div>

      {playError ? (
        <Text variant="body" tone="danger" className="mt-3 text-center">
          {playError}
        </Text>
      ) : null}
    </div>
  );
}
