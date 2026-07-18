"use client";

import { useEffect, useRef, useState } from "react";
import { Text } from "@/components/ui";
import { CheckIcon, CloseIcon } from "@/components/icons";
import { cn } from "@/utils/cn";

const DEFAULT_TITLE = "Fill in the blank";
const SENTENCE_BEFORE = "My name is";
const SENTENCE_AFTER = ".";
const OPTIONS = ["David", "Apple", "Love", "Mother"] as const;
const CORRECT_ANSWER = "David";
const REVEAL_DELAY_MS = 500;

type FillBlankExerciseProps = {
  title?: string;
  onComplete: () => void;
  disabled?: boolean;
};

export function FillBlankExercise({
  title = DEFAULT_TITLE,
  onComplete,
  disabled
}: FillBlankExerciseProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const completedRef = useRef(false);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isCorrect = selected === CORRECT_ANSWER;
  const optionsLocked = disabled || revealed;

  useEffect(() => {
    return () => {
      if (revealTimeoutRef.current) {
        clearTimeout(revealTimeoutRef.current);
      }
    };
  }, []);

  function handleSelect(option: string) {
    if (optionsLocked || completedRef.current) return;
    if (selected === option && !revealed) return;

    if (revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }

    setSelected(option);
    setRevealed(false);

    revealTimeoutRef.current = setTimeout(() => {
      setRevealed(true);

      if (option === CORRECT_ANSWER && !completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
    }, REVEAL_DELAY_MS);
  }

  function blankTextClass() {
    if (!selected) return "text-transparent";
    if (!revealed) return "text-primary";
    return isCorrect ? "text-success" : "text-danger";
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

      <div className="flex w-full items-center justify-center rounded-xl bg-gradient-to-b from-locked-gradient-from to-locked-gradient-to px-5 py-4 sm:px-10">
        <p className="text-center text-body-20 font-medium text-foreground">
          <span>{SENTENCE_BEFORE}</span>
          <span className="mx-2 inline-flex min-w-[4.5rem] flex-col items-center align-baseline">
            <span
              className={cn(
                "px-0.5 font-semibold leading-none",
                blankTextClass()
              )}
            >
              {selected ?? "\u00a0"}
            </span>
            <span
              className="mt-0.5 w-full border-b border-dashed border-muted-foreground"
              aria-hidden
            />
          </span>
          <span>{SENTENCE_AFTER}</span>
        </p>
      </div>

      <div className="grid w-full grid-cols-2 gap-4">
        {OPTIONS.map((option) => {
          const isChosen = selected === option;
          const isPending = isChosen && !revealed;
          const showResult = isChosen && revealed;
          const showCheck = showResult && isCorrect;
          const showCross = showResult && !isCorrect;

          return (
            <button
              key={option}
              type="button"
              disabled={optionsLocked}
              onClick={() => handleSelect(option)}
              className={cn(
                "flex h-14 items-center justify-center rounded-xl px-4 text-body-16 font-semibold",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                "disabled:pointer-events-none disabled:opacity-100",
                showResult && "transition-colors",
                isPending &&
                  "bg-primary text-primary-foreground shadow-[0_6px_16px_rgb(255_103_21_/_0.35)]",
                showResult &&
                  isCorrect &&
                  "bg-success text-primary-foreground shadow-[0_6px_16px_rgb(0_204_68_/_0.35)]",
                showResult &&
                  !isCorrect &&
                  "bg-danger text-primary-foreground shadow-[0_6px_16px_rgb(204_0_0_/_0.3)]",
                !isChosen &&
                  cn(
                    "bg-muted text-foreground shadow-sm",
                    !optionsLocked &&
                      "hover:bg-muted/80 active:bg-primary active:text-primary-foreground active:shadow-[0_6px_16px_rgb(255_103_21_/_0.35)]"
                  )
              )}
            >
              <span className="inline-flex items-center gap-1.5">
                <span>{option}</span>
                {showCheck || showCross ? (
                  <span
                    className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-primary-foreground"
                    aria-hidden
                  >
                    {showCheck ? (
                      <CheckIcon
                        size={12}
                        className="text-primary-foreground"
                      />
                    ) : (
                      <CloseIcon
                        size={12}
                        className="text-primary-foreground"
                      />
                    )}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
