"use client";

import { useEffect, useRef, useState } from "react";
import { Text } from "@/components/ui";
import { SpeakerIcon } from "@/components/icons";
import { useAudioPlayer } from "@/features/lesson/hooks/useAudioPlayer";
import { cn } from "@/utils/cn";

const DEFAULT_TITLE = "Listen and build sentence";
const WORDS = ["David", "My", "is", "name"] as const;
const CORRECT_ORDER = ["My", "name", "is", "David"] as const;
const DEFAULT_AUDIO_URL = "/audio/lesson-1/exercise-4.mp3";
const REVEAL_DELAY_MS = 500;

type ListenBuildExerciseProps = {
  title?: string;
  onComplete: () => void;
  disabled?: boolean;
};

export function ListenBuildExercise({
  title = DEFAULT_TITLE,
  onComplete,
  disabled
}: ListenBuildExerciseProps) {
  const [built, setBuilt] = useState<string[]>([]);
  const [used, setUsed] = useState<boolean[]>(() => WORDS.map(() => false));
  const [revealed, setRevealed] = useState(false);
  const [pendingReveal, setPendingReveal] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const completedRef = useRef(false);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { play } = useAudioPlayer();

  const locked = disabled || hasCompleted || pendingReveal;

  useEffect(() => {
    return () => {
      if (revealTimeoutRef.current) {
        clearTimeout(revealTimeoutRef.current);
      }
    };
  }, []);

  function clearRevealTimeout() {
    if (revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }
  }

  function addWord(word: string, index: number) {
    if (locked || completedRef.current || used[index] || revealed) return;

    const nextBuilt = [...built, word];
    const nextUsed = used.map((isUsed, i) => (i === index ? true : isUsed));

    setBuilt(nextBuilt);
    setUsed(nextUsed);

    if (nextBuilt.length === CORRECT_ORDER.length) {
      setPendingReveal(true);
      clearRevealTimeout();

      revealTimeoutRef.current = setTimeout(() => {
        setRevealed(true);
        setPendingReveal(false);

        const isCorrect = nextBuilt.every((w, i) => w === CORRECT_ORDER[i]);
        if (isCorrect && !completedRef.current) {
          completedRef.current = true;
          setHasCompleted(true);
          onComplete();
        }
      }, REVEAL_DELAY_MS);
    }
  }

  function removeWord(index: number) {
    if (disabled || hasCompleted || pendingReveal) return;

    const word = built[index];
    if (!word) return;

    const bankIndex = WORDS.findIndex((w, i) => w === word && used[i]);
    if (bankIndex === -1) return;

    clearRevealTimeout();
    setRevealed(false);
    setBuilt(built.filter((_, i) => i !== index));
    setUsed((prev) => prev.map((isUsed, i) => (i === bankIndex ? false : isUsed)));
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-10 pt-2">
      <Text
        variant="heading"
        size="title-20"
        tone="primary"
        weight="bold"
        className="text-center"
      >
        {title}
      </Text>

      <div className="flex w-full items-center gap-4 rounded-xl bg-gradient-to-b from-locked-gradient-from to-locked-gradient-to px-5 py-5 sm:px-6">
        <button
          type="button"
          aria-label="Play audio"
          onClick={() => play(DEFAULT_AUDIO_URL)}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_4px_12px_rgb(255_103_21_/_0.35)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <SpeakerIcon size={22} className="text-primary-foreground" />
        </button>

        <div className="flex min-h-[2.5rem] flex-1 flex-col justify-end">
          <div className="flex min-h-[2rem] flex-wrap items-end gap-2">
            {built.map((word, index) => {
              const isPositionCorrect = word === CORRECT_ORDER[index];
              const showResult = revealed;

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
        {WORDS.map((word, index) => {
          const isUsed = used[index];
          const bankLocked = locked || revealed || isUsed;

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
    </div>
  );
}
