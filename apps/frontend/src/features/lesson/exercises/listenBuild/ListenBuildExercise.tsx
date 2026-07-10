"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Text
} from "@/components/ui";

const WORDS = ["I", "go", "to", "school"];
const CORRECT_ORDER = ["I", "go", "to", "school"];

type ListenBuildExerciseProps = {
  title?: string;
  onComplete: () => void;
  disabled?: boolean;
};

export function ListenBuildExercise({
  title = "Listen and build sentence",
  onComplete,
  disabled
}: ListenBuildExerciseProps) {
  const [built, setBuilt] = useState<string[]>([]);
  const [available, setAvailable] = useState<string[]>([...WORDS]);

  function addWord(word: string, index: number) {
    if (disabled) return;

    const nextBuilt = [...built, word];
    const nextAvailable = available.filter((_, i) => i !== index);

    setBuilt(nextBuilt);
    setAvailable(nextAvailable);

    if (nextBuilt.length === CORRECT_ORDER.length) {
      const isCorrect = nextBuilt.every((w, i) => w === CORRECT_ORDER[i]);
      if (isCorrect) onComplete();
    }
  }

  function reset() {
    setBuilt([]);
    setAvailable([...WORDS]);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <Text variant="body">
          Listen to the sentence, then tap words in the correct order.
        </Text>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="min-h-12 rounded-md border border-dashed border-border bg-muted p-3">
          <Text variant="body" size="body-14">
            {built.length > 0 ? built.join(" ") : "Build your sentence here…"}
          </Text>
        </div>
        <div className="flex flex-wrap gap-2">
          {available.map((word, index) => (
            <Button
              key={`${word}-${index}`}
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => addWord(word, index)}
              disabled={disabled}
            >
              {word}
            </Button>
          ))}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={reset}>
          Reset
        </Button>
      </CardContent>
    </Card>
  );
}
