"use client";

import Image from "next/image";
import { useState } from "react";
import type { ConversationAttemptResponse } from "@english-learning/contracts/learning";
import { Button, Text } from "@/components/ui";
import { MicrophoneIcon, SpeakerIcon } from "@/components/icons";
import { ConversationAttemptResult } from "@/features/lesson/exercises/conversation/ConversationAttemptResult";
import { useAudioPlayer } from "@/features/lesson/hooks/useAudioPlayer";
import { useAudioRecorder } from "@/features/lesson/hooks/useAudioRecorder";
import type { DialogueLine } from "@/features/lesson/types/Lesson";
import { conversationService } from "@/services/conversationService";
import { cn } from "@/utils/cn";

type ConversationExerciseProps = {
  lessonItemId: string;
  lessonId: string;
  lessonTitle: string;
  title?: string;
  question?: string;
  dialogue?: DialogueLine[];
  sampleAnswers?: string[];
  expectedTopics?: string[];
  learningSessionId: string;
  onComplete: () => void;
  disabled?: boolean;
  sharedResult?: Pick<
    ConversationAttemptResponse,
    "transcript" | "scores" | "feedback"
  > | null;
};

type UiPhase = "idle" | "submitting" | "result";

const DEFAULT_DIALOGUE: DialogueLine[] = [
  { text: "I am from Singapore." },
  { text: "Where are you from?" }
];

const DEFAULT_SUGGESTIONS = [
  "I am from [Current City].",
  "I'm originally from [Current City].",
  "I'm based in [Current City] now, but I grew up in [Birthplace]."
] as const;

export function ConversationExercise({
  lessonItemId,
  lessonId,
  lessonTitle: _lessonTitle,
  title = "Warm-up Conversation",
  question = "Where are you from?",
  dialogue,
  sampleAnswers,
  expectedTopics: _expectedTopics,
  learningSessionId,
  onComplete,
  disabled,
  sharedResult = null
}: ConversationExerciseProps) {
  const lines = dialogue?.length ? dialogue : DEFAULT_DIALOGUE;
  const suggestions = sampleAnswers?.length
    ? sampleAnswers
    : [...DEFAULT_SUGGESTIONS];

  const { play, error: playError } = useAudioPlayer();
  const recorder = useAudioRecorder();
  const [phase, setPhase] = useState<UiPhase>("idle");
  const [localResult, setLocalResult] = useState<ConversationAttemptResponse | null>(
    null
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  const displayResult = sharedResult ?? localResult;
  const showingResult = Boolean(displayResult);
  const busy = disabled || phase === "submitting";
  const isRecording = recorder.status === "recording";

  async function handleMicClick() {
    if (busy || showingResult) return;
    setSubmitError(null);

    if (!isRecording) {
      await recorder.start();
      return;
    }

    const blob = await recorder.stop();
    if (!blob) {
      // recorder.error already explains short/empty capture
      return;
    }

    setPhase("submitting");
    try {
      const response = await conversationService.submitAttempt({
        audio: blob,
        lessonItemId,
        lessonId,
        learningSessionId
      });
      setLocalResult(response);
      setPhase("result");
      onComplete();
    } catch (error) {
      setPhase("idle");
      setSubmitError(
        error instanceof Error ? error.message : "Failed to evaluate attempt"
      );
    }
  }

  return (
    <div className="relative flex h-full min-h-[420px] flex-col">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
        <div className="flex items-start gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#F4A48A] sm:h-24 sm:w-24">
            <Image
              src="/img/lesson-1/conversation_avatar.png"
              alt=""
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>

          <div className="min-w-0 flex-1 space-y-2 pt-1">
            {lines.map((line) => (
              <div key={line.text} className="flex items-start gap-2">
                <Text
                  variant="heading"
                  size="title-20"
                  tone="default"
                  weight="semibold"
                >
                  {line.text}
                </Text>
                <button
                  type="button"
                  aria-label={`Play audio: ${line.text}`}
                  disabled={!line.audioUrl}
                  onClick={() => {
                    if (line.audioUrl) {
                      void play(line.audioUrl);
                    }
                  }}
                  className={cn(
                    "pointer-events-auto relative z-30 mt-1.5 inline-flex shrink-0 text-muted-foreground transition-colors",
                    line.audioUrl
                      ? "hover:text-foreground"
                      : "cursor-default opacity-40"
                  )}
                >
                  <SpeakerIcon size={24} className="text-inherit" />
                </button>
              </div>
            ))}

            {!showingResult ? (
              <div className="!mt-10 flex flex-col gap-3 rounded-xl bg-gradient-to-b from-locked-gradient-from to-locked-gradient-to px-5 py-4">
                <Text variant="label" tone="primary" weight="semibold">
                  AI Suggestion
                </Text>
                <ul className="space-y-2">
                  {suggestions.map((suggestion) => (
                    <li key={suggestion}>
                      <Text variant="body" tone="default">
                        {suggestion}
                      </Text>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {displayResult ? (
              <ConversationAttemptResult result={displayResult} />
            ) : null}
          </div>
        </div>
      </div>

      {(recorder.error || submitError || playError) && !showingResult ? (
        <div className="mx-auto mt-4 w-full max-w-3xl px-1">
          <Text variant="body" tone="danger">
            {submitError ?? recorder.error ?? playError}
          </Text>
        </div>
      ) : null}

      {!showingResult ? (
        <div className="flex shrink-0 justify-center pb-2 pt-10">
          <Button
            type="button"
            disabled={busy}
            onClick={() => void handleMicClick()}
            className="h-14 min-w-[175px] gap-2.5 rounded-[12px] px-7 text-body-16 font-bold text-primary-foreground shadow-none focus-visible:ring-offset-0"
          >
            <MicrophoneIcon size={22} className="text-primary-foreground" />
            {phase === "submitting"
              ? "Evaluating…"
              : isRecording
                ? "Tap to Stop"
                : "Tap to Speak"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
