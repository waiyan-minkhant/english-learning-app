import type { ReactNode } from "react";
import { PUZZLE, questionCapPath } from "./puzzleGeometry";
import { cn } from "@/utils/cn";

type PuzzleQuestionCapProps = {
  children: ReactNode;
  className?: string;
};

export function PuzzleQuestionCap({
  children,
  className
}: PuzzleQuestionCapProps) {
  const { width, capHeight, tabRadius } = PUZZLE;
  const path = questionCapPath();
  const bodyHeightPercent = ((capHeight - tabRadius) / capHeight) * 100;

  return (
    <div
      className={cn("relative z-0 w-full", className)}
      style={{ aspectRatio: `${width} / ${capHeight}` }}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${width} ${capHeight}`}
        preserveAspectRatio="none"
        aria-hidden
      >
        <path d={path} fill="#F7F8F8" />
      </svg>
      <div
        className="absolute inset-x-0 top-0 flex items-center justify-center px-3 text-center text-body-14 font-medium text-foreground sm:text-body-16"
        style={{ height: `${bodyHeightPercent}%` }}
      >
        {children}
      </div>
    </div>
  );
}
