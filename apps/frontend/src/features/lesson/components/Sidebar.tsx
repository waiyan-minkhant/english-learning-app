"use client";

import { Button, Text } from "@/components/ui";
import { useLessonViewModel } from "@/features/lesson/hooks/useLessonViewModel";
import { cn } from "@/utils/cn";

type SidebarProps = {
  lessonId: string;
  learningSessionId: string;
  className?: string;
};

export function Sidebar({
  lessonId,
  learningSessionId,
  className
}: SidebarProps) {
  const { progressBarItems, itemIndex, onGoToItem } = useLessonViewModel(
    lessonId,
    { mode: "solo", learningSessionId }
  );

  return (
    <aside
      className={cn(
        "w-64 shrink-0 overflow-y-auto border-r border-border bg-surface p-4",
        className
      )}
      aria-label="Lesson outline"
    >
      <Text variant="title" as="h2" className="mb-3">
        Outline
      </Text>
      <ol className="space-y-1">
        {progressBarItems.map((item, index) => (
          <li key={item.id}>
            <Button
              type="button"
              variant={index === itemIndex ? "secondary" : "ghost"}
              className={cn(
                "h-auto w-full flex-col items-start px-3 py-2",
                item.status === "completed" &&
                  index !== itemIndex &&
                  "text-success-foreground"
              )}
              onClick={() => onGoToItem(index)}
            >
              <Text variant="caption" tone="muted" as="span" className="uppercase">
                {item.kind}
              </Text>
              {item.label}
            </Button>
          </li>
        ))}
      </ol>
    </aside>
  );
}
