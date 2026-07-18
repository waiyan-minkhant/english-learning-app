import type { Step } from "@/features/lesson/types/Lesson";
import { KnowledgeContent } from "@/features/lesson/content/KnowledgeContent";
import { ExerciseRenderer } from "@/features/lesson/components/ExerciseRenderer";

type StepRendererProps = {
  step: Step;
  lessonId: string;
  lessonTitle: string;
  sessionId?: string;
  onExerciseComplete: () => void;
  onContentRead: () => void;
  exerciseDisabled?: boolean;
};

export function StepRenderer({
  step,
  lessonId,
  lessonTitle,
  sessionId,
  onExerciseComplete,
  onContentRead,
  exerciseDisabled
}: StepRendererProps) {
  if (step.type === "content") {
    return (
      <KnowledgeContent
        title={step.title}
        audioUrl={step.audioUrl}
        onContinue={onContentRead}
      />
    );
  }

  return (
    <ExerciseRenderer
      step={step}
      lessonId={lessonId}
      lessonTitle={lessonTitle}
      sessionId={sessionId}
      onComplete={onExerciseComplete}
      disabled={exerciseDisabled}
    />
  );
}
