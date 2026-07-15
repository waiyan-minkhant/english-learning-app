"use client";

import { useEffect, useId, useRef, useState } from "react";
import { SettingsIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { ClassroomControlPanel } from "@/features/classroom/components/ClassroomControlPanel";
import { useClassroomMedia } from "@/features/classroom/context/ClassroomMediaContext";
import { useParticipantControls } from "@/features/classroom/hooks/useParticipantControls";
import { cn } from "@/utils/cn";

type MediaControlsPopoverProps = {
  className?: string;
};

export function MediaControlsPopover({ className }: MediaControlsPopoverProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const {
    camEnabled,
    micEnabled,
    connected,
    toggleCam,
    toggleMic
  } = useClassroomMedia();
  const { microphoneEnabled } = useParticipantControls();

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
        <div className="absolute bottom-full right-0 z-30 mb-2 w-64 drop-shadow-lg">
          <ClassroomControlPanel
            id={panelId}
            className="w-full"
            camEnabled={camEnabled}
            micEnabled={micEnabled}
            connected={connected}
            micAllowed={microphoneEnabled}
            toggleCam={toggleCam}
            toggleMic={toggleMic}
          />
        </div>
      ) : null}

      <Button
        type="button"
        size="icon"
        variant="secondary"
        className="rounded-pill border-border bg-white text-foreground shadow-md"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Show media controls"
        onClick={() => setOpen((current) => !current)}
      >
        <SettingsIcon size={20} className="text-foreground" />
      </Button>
    </div>
  );
}
