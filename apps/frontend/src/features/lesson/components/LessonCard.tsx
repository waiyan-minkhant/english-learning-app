"use client";

import { CheckIcon, LockIcon } from "@/components/icons";
import { CircularProgress } from "@/features/lesson/components/CircularProgress";
import {
  lessonCardDescriptionVariants,
  lessonCardTitleVariants,
  lessonCardVariants,
  lessonCompleteBadgeVariants,
  lessonLockedPillVariants,
  lessonNumberBadgeVariants
} from "@/features/lesson/components/lessonCardVariants";
import type { LessonListItem } from "@/features/lesson/hooks/useLessonListViewModel";
import { cn } from "@/utils/cn";

type LessonCardProps = {
  item: LessonListItem;
  onSelect?: (lessonId: string) => void;
};

export function LessonCard({ item, onSelect }: LessonCardProps) {
  const { lesson, status, progressPercent, displayTitle, displayDescription, number } =
    item;
  const isLocked = status === "locked";
  const isClickable = !isLocked && onSelect;
  const cardStatus = isLocked ? "locked" : "active";

  function handleClick() {
    if (!isClickable) return;
    onSelect(lesson.id);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (!isClickable) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(lesson.id);
    }
  }

  return (
    <div
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={lessonCardVariants({ status: cardStatus })}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={lessonNumberBadgeVariants({ status: cardStatus })}>
          {number}
        </div>

        {isLocked ? (
          <span className={lessonLockedPillVariants()}>
            <LockIcon size={14} className="text-icon" aria-hidden />
            Locked
          </span>
        ) : status === "complete" ? (
          <div className={lessonCompleteBadgeVariants()}>
            <CheckIcon size={20} className="text-primary" />
          </div>
        ) : (
          <CircularProgress value={progressPercent} />
        )}
      </div>

      <div className={cn("mt-lg space-y-sm")}>
        <h3 className={lessonCardTitleVariants({ status: cardStatus })}>
          {displayTitle}
        </h3>
        <p className={lessonCardDescriptionVariants()}>{displayDescription}</p>
      </div>
    </div>
  );
}
