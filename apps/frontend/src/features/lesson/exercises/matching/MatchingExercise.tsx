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
import { cn } from "@/utils/cn";

const PAIRS = [
  { left: "Hello", right: "Greeting" },
  { left: "Goodbye", right: "Farewell" },
  { left: "Thank you", right: "Gratitude" }
];

type MatchingExerciseProps = {
  title?: string;
  onComplete: () => void;
  disabled?: boolean;
};

export function MatchingExercise({
  title = "Matching",
  onComplete,
  disabled
}: MatchingExerciseProps) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());

  function handleSelectLeft(value: string) {
    if (matched.has(value)) return;
    setSelectedLeft(value);
  }

  function handleSelectRight(value: string) {
    if (!selectedLeft || disabled) return;

    const pair = PAIRS.find((p) => p.left === selectedLeft);
    if (pair?.right === value) {
      const next = new Set(matched);
      next.add(selectedLeft);
      setMatched(next);
      setSelectedLeft(null);
      if (next.size === PAIRS.length) {
        onComplete();
      }
    } else {
      setSelectedLeft(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <Text variant="body">Match each word with its meaning.</Text>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2">
        <ul className="space-y-2">
          {PAIRS.map((pair) => (
            <li key={pair.left}>
              <Button
                type="button"
                variant={
                  matched.has(pair.left)
                    ? "primary"
                    : selectedLeft === pair.left
                      ? "secondary"
                      : "ghost"
                }
                className={cn(
                  "h-auto w-full justify-start px-4 py-2",
                  matched.has(pair.left) && "bg-success/15 text-success-foreground"
                )}
                onClick={() => handleSelectLeft(pair.left)}
                disabled={disabled || matched.has(pair.left)}
              >
                {pair.left}
              </Button>
            </li>
          ))}
        </ul>
        <ul className="space-y-2">
          {PAIRS.map((pair) => (
            <li key={pair.right}>
              <Button
                type="button"
                variant="ghost"
                className="h-auto w-full justify-start px-4 py-2"
                onClick={() => handleSelectRight(pair.right)}
                disabled={disabled}
              >
                {pair.right}
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
