import { Button, Card, CardContent, CardHeader, CardTitle, Text } from "@/components/ui";

type KnowledgeContentProps = {
  title?: string;
  onContinue?: () => void;
};

export function KnowledgeContent({
  title = "Lesson content",
  onContinue
}: KnowledgeContentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Text variant="body" tone="default">
          In this section, your teacher shares key vocabulary and grammar points
          for the lesson. Review the examples below before moving on to exercises.
        </Text>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <Text variant="body" tone="default" as="span">
              Use simple present tense for daily routines.
            </Text>
          </li>
          <li>
            <Text variant="body" tone="default" as="span">
              Greetings: Hello, Hi, Good morning.
            </Text>
          </li>
          <li>
            <Text variant="body" tone="default" as="span">
              Polite responses: Thank you, You&apos;re welcome.
            </Text>
          </li>
        </ul>
        {onContinue ? (
          <Button type="button" variant="ghost" onClick={onContinue}>
            Mark as read
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
