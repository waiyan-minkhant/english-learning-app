"use client";

import { Button, Text } from "@/components/ui";
import { cn } from "@/utils/cn";

type AnswerRevealProps = {
  answerKey: string;
  revealed: boolean;
  canReveal: boolean;
  onReveal: () => void;
};

export function AnswerReveal({
  answerKey,
  revealed,
  canReveal,
  onReveal
}: AnswerRevealProps) {
  return (
    <div className="mx-auto mt-10 flex w-full max-w-xl flex-col items-center gap-4">
      {canReveal && !revealed ? (
        <Button type="button" onClick={onReveal}>
          Reveal answers
        </Button>
      ) : null}

      <div
        className={cn(
          "w-full text-center",
          revealed ? "visible" : "invisible select-none"
        )}
        aria-hidden={!revealed}
      >
        <Text
          variant="body"
          size="body-16"
          weight="semibold"
          className="whitespace-pre-line text-foreground"
        >
          {answerKey}
        </Text>
      </div>
    </div>
  );
}
