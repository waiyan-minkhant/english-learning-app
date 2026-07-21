import type { LessonItem } from "@/features/lesson/types/Lesson";

/** Correct-answer text for the lesson-level answer key, or null if none. */
export function getItemAnswerKey(item: LessonItem): string | null {
  if (item.type !== "exercise") return null;

  switch (item.exerciseType) {
    case "fill_in_blank":
    case "listen_and_fill_in_blank": {
      const answer = item.data.correctAnswer?.trim();
      return answer ? answer : null;
    }
    case "matching": {
      const pairs = item.data.pairs;
      if (!pairs.length) return null;
      return pairs.map((pair) => `${pair.question} → ${pair.answer}`).join("\n");
    }
    case "listen_and_build_sentence": {
      const order = item.data.correctOrder;
      if (!order.length) return null;
      return order.join(" ");
    }
    default:
      return null;
  }
}
