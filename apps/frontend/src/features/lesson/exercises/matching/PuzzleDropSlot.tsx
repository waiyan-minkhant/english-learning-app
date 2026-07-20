import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { PUZZLE, answerPiecePath, pieceHeight } from "./puzzleGeometry";
import { cn } from "@/utils/cn";

type PuzzleDropSlotProps = {
  children?: ReactNode;
  className?: string;
  highlighted?: boolean;
  "aria-label"?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, "children">;

export const PuzzleDropSlot = forwardRef<HTMLDivElement, PuzzleDropSlotProps>(
  function PuzzleDropSlot(
    { children, className, highlighted, "aria-label": ariaLabel, ...rest },
    ref
  ) {
    const { width, strokeWidth, dashArray, tabRadius } = PUZZLE;
    const height = pieceHeight();
    const path = answerPiecePath();
    const bodyHeightPercent = ((height - tabRadius) / height) * 100;

    return (
      <div
        ref={ref}
        aria-label={ariaLabel}
        className={cn("relative w-full", className)}
        style={{ aspectRatio: `${width} / ${height}` }}
        {...rest}
      >
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          aria-hidden
        >
          <path d={path} fill="#FFFFFF" />
          <path
            d={path}
            fill="none"
            stroke={highlighted ? "var(--color-primary)" : "#BDBDBD"}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {children ? (
          <div
            className="absolute inset-x-0 bottom-0 flex items-center justify-center px-3 text-center"
            style={{ height: `${bodyHeightPercent}%` }}
          >
            {children}
          </div>
        ) : null}
      </div>
    );
  }
);
