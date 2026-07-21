"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { Text } from "@/components/ui";
import { SpeakerIcon } from "@/components/icons";
import { useAudioPlayer } from "@/features/lesson/hooks/useAudioPlayer";
import type { ContentImage } from "@/features/lesson/types/Lesson";
import { cn } from "@/utils/cn";

type KnowledgeContentProps = {
  title?: string;
  body?: string;
  images?: ContentImage[];
  audioUrl?: string;
  onContinue?: () => void;
};

export function KnowledgeContent({
  title,
  body,
  images,
  audioUrl,
  onContinue
}: KnowledgeContentProps) {
  const markedRef = useRef(false);
  const { play, error: playError } = useAudioPlayer();

  useEffect(() => {
    if (markedRef.current || !onContinue) return;
    markedRef.current = true;
    onContinue();
  }, [onContinue]);

  if (!title || !body) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center pt-2">
        <Text variant="body" tone="danger">
          Knowledge content is missing from the lesson.
        </Text>
      </div>
    );
  }

  const canPlay = Boolean(audioUrl);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="relative z-30 flex flex-col gap-3 rounded-xl bg-gradient-to-b from-locked-gradient-from to-locked-gradient-to px-5 py-4">
        <button
          type="button"
          aria-label="Play audio"
          disabled={!canPlay}
          onClick={() => {
            if (audioUrl) void play(audioUrl);
          }}
          className={cn(
            "pointer-events-auto absolute right-5 top-4 z-30 inline-flex text-muted-foreground transition-colors",
            canPlay ? "hover:text-foreground" : "cursor-default opacity-40"
          )}
        >
          <SpeakerIcon size={22} className="text-inherit" />
        </button>

        <div className="flex flex-col gap-3 pr-10">
          <Text variant="label" tone="primary" weight="semibold">
            {title}
          </Text>
          <Text variant="body" tone="default" className="!leading-7">
            {body}
          </Text>
          {playError ? (
            <Text variant="caption" tone="danger">
              {playError}
            </Text>
          ) : null}
        </div>
      </div>

      {images?.length ? (
        <div className="grid grid-cols-2 gap-4">
          {images.map((image) => (
            <div
              key={image.src}
              className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 384px"
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
