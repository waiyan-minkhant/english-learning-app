import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Text
} from "@/components/ui";

type ConversationExerciseProps = {
  title?: string;
  onComplete: () => void;
  disabled?: boolean;
};

export function ConversationExercise({
  title = "Conversation",
  onComplete,
  disabled
}: ConversationExerciseProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <Text variant="body">
          Practice speaking with your partner. Say the warm-up phrases aloud.
        </Text>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-muted p-4">
          <Text variant="body" tone="default">
            Teacher: Hello! How are you today?
          </Text>
          <Text variant="body" tone="default" className="mt-2">
            You: I am fine, thank you!
          </Text>
        </div>
        <Button type="button" onClick={onComplete} disabled={disabled}>
          Mark speaking complete
        </Button>
      </CardContent>
    </Card>
  );
}
