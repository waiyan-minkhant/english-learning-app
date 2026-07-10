"use client";

import { Badge, Progress, Text } from "@/components/ui";
import { useLessonViewModel } from "@/features/lesson/hooks/useLessonViewModel";
import { cn } from "@/utils/cn";

type ProgressBarProps = {
  lessonId: string;
  compact?: boolean;
};

export function ProgressBar({ lessonId, compact }: ProgressBarProps) {
  const { progressPercent, progressBarItems } = useLessonViewModel(lessonId, {
    mode: compact ? "classroom" : "solo"
  });

  return (
    <div className={cn("space-y-3", compact && "space-y-2")}>
      <div className="flex items-center justify-between gap-4">
        <Text variant="label">Lesson progress</Text>
        <Text variant="label" tone="muted" className="tabular-nums">
          {progressPercent}%
        </Text>
      </div>
      <Progress value={progressPercent} />
      {!compact ? (
        <ol className="flex flex-wrap gap-2">
          {progressBarItems.map((item, index) => (
            <li key={item.id}>
              <Badge
                variant={
                  item.status === "completed"
                    ? "success"
                    : item.status === "current"
                      ? "default"
                      : "secondary"
                }
                className={cn(item.status === "upcoming" && "opacity-60")}
              >
                {index + 1}. {item.label}
              </Badge>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
