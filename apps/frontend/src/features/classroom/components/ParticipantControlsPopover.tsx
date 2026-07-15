"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { UsersIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { ParticipantControlsPanel } from "@/features/classroom/components/ParticipantControlsPanel";
import { countActiveParticipants } from "@/features/classroom/lib/participantVisibility";
import { usePresenceStore } from "@/features/classroom/store/presenceStore";
import type { ParticipantControlsActions } from "@/features/realtime/hooks/useParticipantControlsSync";
import { cn } from "@/utils/cn";

type ParticipantControlsPopoverProps = {
  className?: string;
  onOpenChange?: (open: boolean) => void;
} & ParticipantControlsActions;

export function ParticipantControlsPopover({
  className,
  onOpenChange,
  updateParticipantControls,
  updateBulkParticipantControls
}: ParticipantControlsPopoverProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const participantCount = usePresenceStore((state) =>
    countActiveParticipants(state.participants)
  );

  const setOpenAndNotify = useCallback(
    (next: boolean) => {
      setOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange]
  );

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenAndNotify(false);
    };

    const onMouseDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpenAndNotify(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onMouseDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [open, setOpenAndNotify]);

  return (
    <div
      ref={containerRef}
      className={cn("relative", open && "z-50", className)}
    >
      {open ? (
        <div className="absolute bottom-full right-0 z-50 mb-2 drop-shadow-lg">
          <ParticipantControlsPanel
            id={panelId}
            updateParticipantControls={updateParticipantControls}
            updateBulkParticipantControls={updateBulkParticipantControls}
          />
        </div>
      ) : null}

      <div className="relative">
        <Button
          type="button"
          size="icon"
          className="rounded-pill border-border bg-primary shadow-md"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label="Show participants and controls"
          onClick={() => setOpenAndNotify(!open)}
        >
          <UsersIcon size={20} className="text-white" />
        </Button>

        {participantCount > 0 ? (
          <span
            className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-pill border border-border bg-surface px-1 text-body-12 font-medium text-foreground shadow-sm"
            aria-hidden
          >
            {participantCount}
          </span>
        ) : null}
      </div>
    </div>
  );
}
