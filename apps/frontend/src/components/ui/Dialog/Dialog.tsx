"use client";

import * as React from "react";
import { cn } from "@/utils/cn";
import { Button } from "../Button";
import { Text } from "../Text";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
};

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className
}: DialogProps) {
  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-overlay flex items-center justify-center">
      <button
        type="button"
        aria-label="Close dialog overlay"
        className="absolute inset-0 bg-foreground/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={cn(
          "relative z-modal mx-4 w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-lg",
          className
        )}
      >
        <Text id="dialog-title" variant="heading" size="title-20" as="h2">
          {title}
        </Text>
        {description ? (
          <Text variant="body" className="mt-2">
            {description}
          </Text>
        ) : null}
        {children ? <div className="mt-4">{children}</div> : null}
        <div className="mt-6 flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
