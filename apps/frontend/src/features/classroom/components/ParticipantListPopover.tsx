"use client";

import { useEffect, useId, useRef, useState } from "react";
import { UsersIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { ParticipantListPanel } from "@/features/classroom/components/PaticipantList";
import { countActiveParticipants } from "@/features/classroom/lib/participantVisibility";
import { usePresenceStore } from "@/features/classroom/store/presenceStore";
import { cn } from "@/utils/cn";

type ParticipantListPopoverProps = {
  className?: string;
};

export function ParticipantListPopover({ className }: ParticipantListPopoverProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const participantCount = usePresenceStore((state) =>
    countActiveParticipants(state.participants)
  );

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const onMouseDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onMouseDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {open ? (
        <div className="absolute bottom-full right-0 z-30 mb-2">
          <ParticipantListPanel id={panelId} />
        </div>
      ) : null}

      <div className="relative">
        <Button
          type="button"
          // variant="ghost"
          size="icon"
          className="rounded-pill border-border bg-primary shadow-md"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label="Show participants"
          onClick={() => setOpen((current) => !current)}
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
