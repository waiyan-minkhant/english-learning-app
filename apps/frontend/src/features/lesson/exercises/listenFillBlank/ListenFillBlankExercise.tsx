"use client";

import { useEffect, useRef, useState } from "react";
import { Text } from "@/components/ui";
import { CheckIcon, CloseIcon, SpeakerIcon } from "@/components/icons";
import { useAudioPlayer } from "@/features/lesson/hooks/useAudioPlayer";
import { lessonService } from "@/services/lessonService";
import type { StudentAttemptView } from "@/features/realtime/hooks/useLessonAttemptsSync";
import { cn } from "@/utils/cn";

const DEFAULT_TITLE = "Listen and fill in the blank";
const REVEAL_DELAY_MS = 500;

type ListenFillBlankExerciseProps = {
  lessonItemId: string;
  learningSessionId: string;
  title?: string;
  audioUrl?: string;
  sentenceBefore?: string;
  sentenceAfter?: string;
  options?: string[];
  correctAnswer?: string;
  onComplete: () => void;
  disabled?: boolean;
  sharedAttempt?: StudentAttemptView | null;
};

export function ListenFillBlankExercise({
  lessonItemId,
  learningSessionId,
  title = DEFAULT_TITLE,
  audioUrl,
  sentenceBefore,
  sentenceAfter,
  options,
  correctAnswer,
  onComplete,
  disabled,
  sharedAttempt = null
}: ListenFillBlankExerciseProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const completedRef = useRef(false);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { play, error: playError } = useAudioPlayer();

  const mirrored = Boolean(sharedAttempt?.selectedAnswer);
  const displaySelected = mirrored
    ? (sharedAttempt!.selectedAnswer ?? null)
    : selected;
  const displayRevealed = mirrored ? true : revealed;

  const hasData =
    Boolean(sentenceBefore !== undefined) &&
    Boolean(sentenceAfter !== undefined) &&
    Boolean(options?.length) &&
    Boolean(correctAnswer);

  const isCorrect = displaySelected === correctAnswer;
  const optionsLocked = disabled || displayRevealed || mirrored;

  useEffect(() => {
    return () => {
      if (revealTimeoutRef.current) {
        clearTimeout(revealTimeoutRef.current);
      }
    };
  }, []);

  if (!hasData || !options || !correctAnswer) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col items-center pt-2">
        <Text variant="body" tone="danger">
          Listen-and-fill-in-the-blank data is missing from the lesson.
        </Text>
      </div>
    );
  }

  function handleSelect(option: string) {
    if (optionsLocked || completedRef.current || mirrored) return;
    if (selected === option && !revealed) return;

    if (revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }

    setSelected(option);
    setRevealed(false);

    revealTimeoutRef.current = setTimeout(() => {
      setRevealed(true);

      if (!completedRef.current) {
        const correct = option === correctAnswer;
        if (correct) {
          completedRef.current = true;
        }
        void lessonService
          .submitListenFillBlankAttempt(
            lessonItemId,
            learningSessionId,
            option
          )
          .then(() => {
            if (correct) onComplete();
          })
          .catch(() => {
            if (correct) completedRef.current = false;
          });
      }
    }, REVEAL_DELAY_MS);
  }

  function blankTextClass() {
    if (!displaySelected) return "text-transparent";
    if (!displayRevealed) return "text-primary";
    return isCorrect ? "text-success" : "text-danger";
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

      <div className="flex w-full items-center gap-4 rounded-xl bg-gradient-to-b from-locked-gradient-from to-locked-gradient-to px-5 py-4 sm:px-6">
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

        <p className="text-body-20 font-medium text-foreground">
          <span>{sentenceBefore}</span>
          <span className="mx-2 inline-flex min-w-[4.5rem] flex-col items-center align-baseline">
            <span
              className={cn(
                "px-0.5 font-semibold leading-none",
                blankTextClass()
              )}
            >
              {displaySelected ?? "\u00a0"}
            </span>
            <span
              className="mt-0.5 w-full border-b border-dashed border-muted-foreground"
              aria-hidden
            />
          </span>
          <span>{sentenceAfter}</span>
        </p>
      </div>

      <div className="grid w-full grid-cols-2 gap-4">
        {options.map((option) => {
          const isChosen = displaySelected === option;
          const isPending = isChosen && !displayRevealed;
          const showResult = isChosen && displayRevealed;
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

      {playError ? (
        <Text variant="body" tone="danger" className="mt-3 text-center">
          {playError}
        </Text>
      ) : null}
    </div>
  );
}
