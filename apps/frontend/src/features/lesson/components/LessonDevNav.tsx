"use client";

import { Button, Text } from "@/components/ui";

type LessonDevNavProps = {
  stepIndex: number;
  stepCount: number;
  onPrev: () => void;
  onNext: () => void;
};

export function LessonDevNav({
  stepIndex,
  stepCount,
  onPrev,
  onNext
}: LessonDevNavProps) {
  if (stepCount <= 0) return null;

  const canPrev = stepIndex > 0;
  const canNext = stepIndex < stepCount - 1;

  return (
    <div className="pointer-events-auto absolute bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-primary px-2 py-1.5 text-primary-foreground shadow-md">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onPrev}
        disabled={!canPrev}
        className="text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
      >
        Prev
      </Button>
      <Text
        variant="caption"
        className="min-w-10 text-center tabular-nums text-primary-foreground"
      >
        {stepIndex + 1}/{stepCount}
      </Text>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onNext}
        disabled={!canNext}
        className="text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
      >
        Next
      </Button>
    </div>
  );
}
