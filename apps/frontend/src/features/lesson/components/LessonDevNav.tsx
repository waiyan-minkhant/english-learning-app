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
    <div className="pointer-events-auto absolute bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg border border-border bg-surface/95 px-2 py-1.5 shadow-md backdrop-blur-sm">
      <Text variant="caption" tone="muted" className="px-1">
        Dev
      </Text>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={onPrev}
        disabled={!canPrev}
      >
        Prev
      </Button>
      <Text variant="caption" tone="muted" className="min-w-10 text-center tabular-nums">
        {stepIndex + 1}/{stepCount}
      </Text>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={onNext}
        disabled={!canNext}
      >
        Next
      </Button>
    </div>
  );
}
