"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { Text } from "@/components/ui";
import { SpeakerIcon } from "@/components/icons";
import { useAudioPlayer } from "@/features/lesson/hooks/useAudioPlayer";
import { cn } from "@/utils/cn";

type KnowledgeContentProps = {
  title?: string;
  audioUrl?: string;
  onContinue?: () => void;
};

const KNOWLEDGE_TITLE = "Do you know about Singapore?";
const KNOWLEDGE_BODY =
  "Singapore is a small country in Southeast Asia. It is famous for being clean, safe, and modern. Many people speak English there, and it has many tall buildings, good transportation, and delicious food.";

const KNOWLEDGE_IMAGES = [
  {
    src: "/img/lesson-1/knowledge_sharing_pic1.png",
    alt: "Marina Bay Sands and ArtScience Museum in Singapore"
  },
  {
    src: "/img/lesson-1/knowledge_sharing_pic2.png",
    alt: "Merlion statue with Singapore skyline"
  }
] as const;

export function KnowledgeContent({
  audioUrl,
  onContinue
}: KnowledgeContentProps) {
  const markedRef = useRef(false);
  const { play } = useAudioPlayer();

  useEffect(() => {
    if (markedRef.current || !onContinue) return;
    markedRef.current = true;
    onContinue();
  }, [onContinue]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="relative flex flex-col gap-3 rounded-xl bg-gradient-to-b from-locked-gradient-from to-locked-gradient-to px-5 py-4">
        <button
          type="button"
          aria-label="Play audio"
          disabled={!audioUrl}
          onClick={() => {
            if (audioUrl) play(audioUrl);
          }}
          className={cn(
            "absolute right-5 top-4 inline-flex text-muted-foreground transition-colors",
            audioUrl ? "hover:text-foreground" : "cursor-default opacity-40"
          )}
        >
          <SpeakerIcon size={22} className="text-inherit" />
        </button>

        <div className="flex flex-col gap-3 pr-10">
          <Text variant="label" tone="primary" weight="semibold">
            {KNOWLEDGE_TITLE}
          </Text>
          <Text variant="body" tone="default" className="!leading-7">
            {KNOWLEDGE_BODY}
          </Text>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {KNOWLEDGE_IMAGES.map((image) => (
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
    </div>
  );
}
