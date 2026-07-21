import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Text
} from "@/components/ui";
import { lessonService } from "@/services/lessonService";
import type { StudentAttemptView } from "@/features/realtime/hooks/useLessonAttemptsSync";

type ListenSpeakExerciseProps = {
  lessonItemId: string;
  learningSessionId: string;
  title?: string;
  expectedSentence?: string;
  audioUrl?: string;
  onComplete: () => void;
  disabled?: boolean;
  sharedAttempt?: StudentAttemptView | null;
};

export function ListenSpeakExercise({
  lessonItemId,
  learningSessionId,
  title = "Listen and speak",
  expectedSentence,
  onComplete,
  disabled,
  sharedAttempt = null
}: ListenSpeakExerciseProps) {
  const completed = sharedAttempt?.type === "listen_and_speak";

  if (!expectedSentence) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col items-center pt-2">
        <Text variant="body" tone="danger">
          Listen-and-speak data is missing from the lesson.
        </Text>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-foreground p-6 text-center">
          <Text
            variant="title"
            size="body-20"
            tone="default"
            className="text-primary-foreground"
          >
            {expectedSentence}
          </Text>
          <Text variant="caption" className="mt-2 text-primary-foreground/70">
            Tap play to listen (placeholder)
          </Text>
        </div>
        {completed ? (
          <Text variant="body" tone="success">
            Phrase spoken
          </Text>
        ) : (
          <Button
            type="button"
            disabled={disabled}
            onClick={() => {
              void lessonService
                .submitListenSpeakAttempt(lessonItemId, learningSessionId)
                .then(() => onComplete());
            }}
          >
            I spoke the phrase
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
