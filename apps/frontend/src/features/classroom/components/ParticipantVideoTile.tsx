"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject
} from "react";
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

const HAVE_CURRENT_DATA = 2;

function assignVideoRef(
  videoRef: VideoRef | undefined,
  element: HTMLDivElement | null
) {
  if (!videoRef) return;
  if (typeof videoRef === "function") {
    videoRef(element);
  } else {
    videoRef.current = element;
  }
}

export function ParticipantVideoTile({
  role,
  name,
  fallback,
  showVideo,
  videoRef,
  isYou,
  className
}: ParticipantVideoTileProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  const setContainerRef = useCallback(
    (element: HTMLDivElement | null) => {
      containerRef.current = element;
      assignVideoRef(videoRef, element);
    },
    [videoRef]
  );

  useEffect(() => {
    if (!showVideo) {
      setIsVideoReady(false);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    let active = true;
    let video: HTMLVideoElement | null = null;

    const markReady = () => {
      if (!active) return;
      setIsVideoReady(true);
    };

    const detachVideoListeners = () => {
      if (!video) return;
      video.removeEventListener("playing", markReady);
      video.removeEventListener("loadeddata", markReady);
      video = null;
    };

    const syncVideoReadiness = () => {
      if (!active) return;
      detachVideoListeners();

      const nextVideo = container.querySelector("video");
      if (!nextVideo) {
        setIsVideoReady(false);
        return;
      }

      video = nextVideo;
      if (video.readyState >= HAVE_CURRENT_DATA) {
        markReady();
        return;
      }

      setIsVideoReady(false);
      video.addEventListener("playing", markReady);
      video.addEventListener("loadeddata", markReady);
    };

    syncVideoReadiness();

    const observer = new MutationObserver(syncVideoReadiness);
    observer.observe(container, { childList: true });

    return () => {
      active = false;
      observer.disconnect();
      detachVideoListeners();
    };
  }, [showVideo]);

  const videoVisible = showVideo && isVideoReady;

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

      {showVideo && !isVideoReady ? (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-surface"
          aria-busy="true"
          aria-label="Loading camera"
        >
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
            aria-hidden
          />
        </div>
      ) : null}

      {videoRef ? (
        <div
          ref={setContainerRef}
          className={cn(
            "absolute inset-0 z-10 h-full w-full scale-x-[-1] bg-media",
            !videoVisible && "pointer-events-none opacity-0"
          )}
          aria-hidden={!videoVisible}
        />
      ) : null}
    </Card>
  );
}
