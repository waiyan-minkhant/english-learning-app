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
        "relative shrink-0 overflow-hidden border-border bg-media",
        VIDEO_TILE_HEIGHT_CLASS,
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
              {isYou ? (
                <Text variant="caption" tone="muted" as="span">
                  {" "}
                  (you)
                </Text>
              ) : null}
            </Text>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
