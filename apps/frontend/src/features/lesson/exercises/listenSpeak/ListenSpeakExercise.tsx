import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Text
} from "@/components/ui";

type ListenSpeakExerciseProps = {
  title?: string;
  onComplete: () => void;
  disabled?: boolean;
};

export function ListenSpeakExercise({
  title = "Listen and speak",
  onComplete,
  disabled
}: ListenSpeakExerciseProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <Text variant="body">
          Listen to the phrase, then repeat it aloud.
        </Text>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-foreground p-6 text-center">
          <Text
            variant="title"
            size="body-20"
            tone="default"
            className="text-primary-foreground"
          >
            Nice to meet you!
          </Text>
          <Text variant="caption" className="mt-2 text-primary-foreground/70">
            Tap play to listen (placeholder)
          </Text>
        </div>
        <Button type="button" onClick={onComplete} disabled={disabled}>
          I spoke the phrase
        </Button>
      </CardContent>
    </Card>
  );
}
