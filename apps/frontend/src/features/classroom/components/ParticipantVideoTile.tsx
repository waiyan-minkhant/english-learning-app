"use client";

import type { RefObject } from "react";
import { Avatar, Card, Text } from "@/components/ui";
import { VIDEO_TILE_HEIGHT_CLASS } from "@/features/classroom/lib/videoTileLayout";
import { cn } from "@/utils/cn";

export type VideoRef =
  | RefObject<HTMLDivElement | null>
  | ((element: HTMLDivElement | null) => void);

type ParticipantVideoTileProps = {
  role: string;
  name: string;
  fallback: string;
  showVideo: boolean;
  videoRef?: VideoRef;
  isYou?: boolean;
  className?: string;
};

export function ParticipantVideoTile({
  role,
  name,
  fallback,
  showVideo,
  videoRef,
  isYou,
  className
}: ParticipantVideoTileProps) {
  return (
    <Card
      className={cn(
        "relative shrink-0 overflow-hidden border-0 bg-surface shadow-none",
        VIDEO_TILE_HEIGHT_CLASS,
        className
      )}
    >
      <div className="absolute inset-0 z-0 flex h-full flex-col items-center justify-center gap-3 p-5 text-center">
        <Avatar fallback={fallback} className="h-16 w-16 text-title-20" />
        <div>
          <Text variant="caption" tone="muted" className="capitalize">
            {role}
          </Text>
          <Text variant="title" size="title-16">
            {name}
            {isYou ? (
              <Text variant="caption" tone="muted" as="span">
                {" "}
                (you)
              </Text>
            ) : null}
          </Text>
        </div>
      </div>

      {videoRef ? (
        <div
          ref={videoRef}
          className={cn(
            "absolute inset-0 z-10 h-full w-full scale-x-[-1] bg-media",
            !showVideo && "pointer-events-none opacity-0"
          )}
          aria-hidden={!showVideo}
        />
      ) : null}
    </Card>
  );
}
