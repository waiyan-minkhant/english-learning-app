"use client";

import type { RefObject } from "react";
import { Avatar, Card, Text } from "@/components/ui";
import { cn } from "@/utils/cn";

type ParticipantVideoTileProps = {
  role: string;
  name: string;
  fallback: string;
  showVideo: boolean;
  videoRef?: RefObject<HTMLDivElement | null>;
  className?: string;
};

export function ParticipantVideoTile({
  role,
  name,
  fallback,
  showVideo,
  videoRef,
  className
}: ParticipantVideoTileProps) {
  return (
    <Card
      className={cn(
        "relative h-[220px] shrink-0 overflow-hidden border-border bg-media",
        className
      )}
    >
      {videoRef ? (
        <div
          ref={videoRef}
          className={cn(
            "absolute inset-0 h-full w-full",
            !showVideo && "pointer-events-none opacity-0"
          )}
          aria-hidden={!showVideo}
        />
      ) : null}

      {!showVideo ? (
        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-3 bg-surface p-5 text-center">
          <Avatar fallback={fallback} className="h-16 w-16 text-title-20" />
          <div>
            <Text variant="caption" tone="muted" className="capitalize">
              {role}
            </Text>
            <Text variant="title" size="title-16">
              {name}
            </Text>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
