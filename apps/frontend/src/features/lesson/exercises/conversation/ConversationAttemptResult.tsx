"use client";

import type { ConversationAttemptResponse } from "@english-learning/contracts/learning";
import { Text } from "@/components/ui";
import { ScoreStars } from "@/features/lesson/exercises/conversation/ScoreStars";

type ConversationAttemptResultProps = {
  result: Pick<ConversationAttemptResponse, "transcript" | "scores" | "feedback">;
};

export function ConversationAttemptResult({
  result
}: ConversationAttemptResultProps) {
  return (
    <div className="!mt-10 space-y-6">
      <div className="space-y-2">
        <Text variant="label" tone="primary" weight="semibold">
          Transcript
        </Text>
        <Text variant="body" tone="default">
          {result.transcript}
        </Text>
      </div>

      <div className="space-y-3">
        <ScoreStars
          label="Answered Question"
          score={result.scores.answeredQuestion}
        />
        <ScoreStars label="Grammar" score={result.scores.grammar} />
        <ScoreStars label="Vocabulary" score={result.scores.vocabulary} />
        <ScoreStars
          label="Sentence Completeness"
          score={result.scores.sentenceCompleteness}
        />
      </div>

      <div className="space-y-2">
        <Text variant="label" tone="primary" weight="semibold">
          Teacher Feedback
        </Text>
        <Text variant="body" tone="default">
          {result.feedback}
        </Text>
      </div>
    </div>
  );
}
