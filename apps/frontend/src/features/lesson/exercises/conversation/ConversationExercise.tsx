"use client";

import Image from "next/image";
import { Button, Text } from "@/components/ui";
import { MicrophoneIcon, SpeakerIcon } from "@/components/icons";

type ConversationExerciseProps = {
  title?: string;
  onComplete: () => void;
  disabled?: boolean;
};

const DIALOGUE_LINES = [
  "I am from Singapore.",
  "Where are you from?"
] as const;

const AI_SUGGESTIONS = [
  "I am from [Current City].",
  "I'm originally from [Current City].",
  "I'm based in [Current City] now, but I grew up in [Birthplace]."
] as const;

export function ConversationExercise({
  onComplete,
  disabled
}: ConversationExerciseProps) {
  return (
    <div className="relative flex h-full min-h-[420px] flex-col">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
        <div className="flex items-start gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#F4A48A] sm:h-24 sm:w-24">
            <Image
              src="/lesson/conversation_avatar.png"
              alt=""
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>

          <div className="min-w-0 flex-1 space-y-2 pt-1">
            {DIALOGUE_LINES.map((line) => (
              <div key={line} className="flex items-start gap-2">
                <Text
                  variant="heading"
                  size="title-20"
                  tone="default"
                  weight="semibold"
                >
                  {line}
                </Text>
                <button
                  type="button"
                  aria-label={`Play audio: ${line}`}
                  className="mt-1.5 inline-flex shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <SpeakerIcon size={24} className="text-inherit" />
                </button>
              </div>
            ))}

            <div className="!mt-10 flex flex-col gap-3 rounded-xl bg-gradient-to-b from-locked-gradient-from to-locked-gradient-to px-5 py-4">
              <Text variant="label" tone="primary" weight="semibold">
                AI Suggestion
              </Text>
              <ul className="space-y-2">
                {AI_SUGGESTIONS.map((suggestion) => (
                  <li key={suggestion}>
                    <Text variant="body" tone="default">
                      {suggestion}
                    </Text>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 justify-center pb-2 pt-10">
        <Button
          type="button"
          disabled={disabled}
          onClick={onComplete}
          className="h-14 min-w-[175px] gap-2.5 rounded-[12px] px-7 text-body-16 font-bold text-primary-foreground shadow-none focus-visible:ring-offset-0"
        >
          <MicrophoneIcon size={22} className="text-primary-foreground" />
          Tap to Speak
        </Button>
      </div>
    </div>
  );
}
