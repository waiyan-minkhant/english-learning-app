"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Text
} from "@/components/ui";

type FillBlankExerciseProps = {
  title?: string;
  onComplete: () => void;
  disabled?: boolean;
};

export function FillBlankExercise({
  title = "Fill in the blank",
  onComplete,
  disabled
}: FillBlankExerciseProps) {
  const [answer, setAnswer] = useState("");

  function handleSubmit() {
    if (answer.trim().length > 0) {
      onComplete();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Text variant="body" tone="default">
          I ___ to school every day.
        </Text>
        <Input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer"
          className="max-w-xs"
          disabled={disabled}
        />
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || !answer.trim()}
        >
          Check answer
        </Button>
      </CardContent>
    </Card>
  );
}
