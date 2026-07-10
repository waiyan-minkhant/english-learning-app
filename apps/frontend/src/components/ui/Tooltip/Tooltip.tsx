"use client";

import * as React from "react";
import { cn } from "@/utils/cn";
import { Text } from "../Text";

type TooltipProps = {
  content: string;
  children: React.ReactElement;
  className?: string;
};

export function Tooltip({ content, children, className }: TooltipProps) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute bottom-full left-1/2 z-tooltip mb-2 hidden -translate-x-1/2 rounded-md border border-border bg-surface px-2 py-1 shadow-sm group-hover:block group-focus-within:block",
          className
        )}
      >
        <Text variant="caption" tone="muted">
          {content}
        </Text>
      </span>
    </span>
  );
}
