import { Text } from "@/components/ui";
import { cn } from "@/utils/cn";

type ScoreStarsProps = {
  label: string;
  score: number;
  max?: number;
};

export function ScoreStars({ label, score, max = 5 }: ScoreStarsProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Text variant="body" tone="default">
        {label}
      </Text>
      <div className="flex gap-0.5" aria-label={`${score} out of ${max}`}>
        {Array.from({ length: max }, (_, index) => {
          const filled = index < score;
          return (
            <span
              key={index}
              className={cn(
                "text-title-20 leading-none",
                filled ? "text-primary" : "text-muted-foreground/35"
              )}
              aria-hidden
            >
              ★
            </span>
          );
        })}
      </div>
    </div>
  );
}
