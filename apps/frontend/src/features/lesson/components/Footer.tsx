"use client";

import { Button } from "@/components/ui";
import { useLessonViewModel } from "@/features/lesson/hooks/useLessonViewModel";

type FooterProps = {
  lessonId: string;
  learningSessionId: string;
  mode?: "solo" | "classroom";
  syncedItemId?: string | null;
  onSyncGoToItem?: (itemId: string) => void;
};

export function Footer({
  lessonId,
  learningSessionId,
  mode = "solo",
  syncedItemId = null,
  onSyncGoToItem
}: FooterProps) {
  const { canGoBack, canGoNext, nextButtonLabel, onBack, onNext } =
    useLessonViewModel(lessonId, {
      mode,
      learningSessionId,
      syncedItemId,
      onSyncGoToItem
    });

  return (
    <footer className="flex items-center justify-between border-t border-border bg-surface px-6 py-4">
      <Button type="button" variant="secondary" onClick={onBack} disabled={!canGoBack}>
        Back
      </Button>
      <Button type="button" onClick={onNext} disabled={!canGoNext}>
        {nextButtonLabel}
      </Button>
    </footer>
  );
}
