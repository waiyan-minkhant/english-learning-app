"use client";

import { cn } from "@/utils/cn";

type LessonProgressPillProps = {
  value: number;
  className?: string;
};

export function LessonProgressPill({
  value,
  className
}: LessonProgressPillProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <div
      className={cn("relative h-8 w-44 sm:w-56", className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Lesson progress"
    >
      <div className="absolute inset-x-0 top-1/2 h-2.5 -translate-y-1/2 rounded-pill bg-muted" />
      <div
        className="absolute left-0 top-1/2 h-2.5 -translate-y-1/2 rounded-pill bg-primary transition-[width] duration-300"
        style={{ width: `${clamped}%` }}
      />
      <div
        className={cn(
          "absolute top-1/2 z-10 -translate-y-1/2 rounded-pill bg-primary px-4 py-0 shadow-md transition-[left] duration-300",
          clamped === 0 ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ left: `${clamped}%` }}
      >
        <span className="text-body-12 font-bold text-primary-foreground tabular-nums">
          {clamped}%
        </span>
      </div>
    </div>
  );
}
