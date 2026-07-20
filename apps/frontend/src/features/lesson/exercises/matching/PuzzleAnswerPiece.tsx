import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { PUZZLE, answerPiecePath, pieceHeight } from "./puzzleGeometry";
import { cn } from "@/utils/cn";

type PuzzleAnswerPieceProps = {
  children: ReactNode;
  className?: string;
  selected?: boolean;
  dragging?: boolean;
  status?: "success" | "error";
} & Omit<HTMLAttributes<HTMLDivElement>, "children">;

function fillForStatus(status?: "success" | "error"): string {
  if (status === "success") return "var(--color-success)";
  if (status === "error") return "var(--color-danger)";
  return "#F7F8F8";
}

function strokeForStatus(
  status: "success" | "error" | undefined,
  selected: boolean | undefined
): string {
  if (status === "success") return "var(--color-success-foreground)";
  if (status === "error") return "var(--color-danger-foreground)";
  if (selected) return "var(--color-primary)";
  return "#BDBDBD";
}

export const PuzzleAnswerPiece = forwardRef<
  HTMLDivElement,
  PuzzleAnswerPieceProps
>(function PuzzleAnswerPiece(
  { children, className, selected, dragging, status, ...rest },
  ref
) {
  const { width, strokeWidth, dashArray, tabRadius } = PUZZLE;
  const height = pieceHeight();
  const path = answerPiecePath();
  const bodyHeightPercent = ((height - tabRadius) / height) * 100;
  const revealed = Boolean(status);

  return (
    <div
      ref={ref}
      className={cn(
        "relative w-full touch-none transition-colors",
        selected && !revealed && "scale-[1.03]",
        dragging && "opacity-30",
        className
      )}
      style={{ aspectRatio: `${width} / ${height}` }}
      {...rest}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        aria-hidden
      >
        <path d={path} fill={fillForStatus(status)} />
        <path
          d={path}
          fill="none"
          stroke={strokeForStatus(status, selected)}
          strokeWidth={strokeWidth}
          strokeDasharray={dashArray}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 flex items-center justify-center px-3 text-center text-body-14 font-medium sm:text-body-16",
          revealed ? "text-primary-foreground" : "text-foreground"
        )}
        style={{ height: `${bodyHeightPercent}%` }}
      >
        {children}
      </div>
    </div>
  );
});
