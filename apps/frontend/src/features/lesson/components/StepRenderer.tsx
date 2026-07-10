import type { Step } from "@/features/lesson/types/Lesson";
import { KnowledgeContent } from "@/features/lesson/content/KnowledgeContent";
import { ExerciseRenderer } from "@/features/lesson/components/ExerciseRenderer";

type StepRendererProps = {
  step: Step;
  onExerciseComplete: () => void;
  onContentRead: () => void;
  exerciseDisabled?: boolean;
};

export function StepRenderer({
  step,
  onExerciseComplete,
  onContentRead,
  exerciseDisabled
}: StepRendererProps) {
  if (step.type === "content") {
    return (
      <KnowledgeContent title={step.title} onContinue={onContentRead} />
    );
  }

  return (
    <ExerciseRenderer
      step={step}
      onComplete={onExerciseComplete}
      disabled={exerciseDisabled}
    />
  );
}
