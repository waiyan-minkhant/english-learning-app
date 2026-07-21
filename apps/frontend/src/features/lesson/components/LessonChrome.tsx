"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Text } from "@/components/ui";
import { HomeIcon } from "@/components/icons";
import { LessonProgressPill } from "@/features/lesson/components/LessonProgressPill";
import { useLessonViewModel } from "@/features/lesson/hooks/useLessonViewModel";
import { cn } from "@/utils/cn";

type LessonChromeProps = {
  lessonId: string;
  mode?: "solo" | "classroom";
  learningSessionId: string;
  syncedItemId?: string | null;
  onSyncGoToItem?: (itemId: string) => void;
  onChangeLesson?: () => void;
  children: ReactNode;
};

const homeButtonClassName =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-primary text-primary-foreground shadow-sm transition-opacity hover:opacity-90";

export function LessonChrome({
  lessonId,
  mode = "solo",
  learningSessionId,
  syncedItemId = null,
  onSyncGoToItem,
  onChangeLesson,
  children
}: LessonChromeProps) {
  const { listTitle, progressPercent } = useLessonViewModel(lessonId, {
    mode,
    learningSessionId,
    syncedItemId,
    onSyncGoToItem
  });

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-5 py-4 sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          {mode === "solo" ? (
            <Link
              href="/dashboard"
              aria-label="Back to dashboard"
              className={homeButtonClassName}
            >
              <HomeIcon size={18} className="text-primary-foreground" />
            </Link>
          ) : onChangeLesson ? (
            <button
              type="button"
              aria-label="Back to lesson list"
              className={homeButtonClassName}
              onClick={onChangeLesson}
            >
              <HomeIcon size={18} className="text-primary-foreground" />
            </button>
          ) : (
            <span
              className={cn(homeButtonClassName, "pointer-events-none opacity-40")}
              aria-hidden
            >
              <HomeIcon size={18} className="text-primary-foreground" />
            </span>
          )}
          <Text
            variant="heading"
            size="title-24"
            tone="primary"
            weight="bold"
            as="h1"
            className="truncate"
          >
            {listTitle}
          </Text>
        </div>

        <LessonProgressPill value={progressPercent} className="shrink-0" />
      </header>

      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
