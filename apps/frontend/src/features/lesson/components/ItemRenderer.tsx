import type { LessonItem } from "@/features/lesson/types/Lesson";
import { DemoCompleteContent } from "@/features/lesson/content/DemoCompleteContent";
import { KnowledgeContent } from "@/features/lesson/content/KnowledgeContent";
import { ExerciseRenderer } from "@/features/lesson/components/ExerciseRenderer";
import type { StudentAttemptView } from "@/features/realtime/hooks/useLessonAttemptsSync";

type ItemRendererProps = {
  item: LessonItem;
  lessonId: string;
  lessonTitle: string;
  learningSessionId: string;
  onExerciseComplete: () => void;
  onContentRead: () => void;
  onFinishDemo?: () => void;
  exerciseDisabled?: boolean;
  teacherReadOnly?: boolean;
  sharedAttempt?: StudentAttemptView | null;
};

export function ItemRenderer({
  item,
  lessonId,
  lessonTitle,
  learningSessionId,
  onExerciseComplete,
  onContentRead,
  onFinishDemo,
  exerciseDisabled,
  teacherReadOnly,
  sharedAttempt
}: ItemRendererProps) {
  if (item.type === "content") {
    if (item.contentType === "demo_complete") {
      return (
        <DemoCompleteContent
          onFinish={onFinishDemo ?? (() => undefined)}
          disabled={Boolean(exerciseDisabled || !onFinishDemo)}
        />
      );
    }

    return (
      <KnowledgeContent
        title={item.title}
        body={item.data.body}
        images={item.data.media?.images}
        audioUrl={item.data.media?.audio}
        onContinue={exerciseDisabled ? undefined : onContentRead}
      />
    );
  }

  return (
    <ExerciseRenderer
      key={item.id}
      item={item}
      lessonId={lessonId}
      lessonTitle={lessonTitle}
      learningSessionId={learningSessionId}
      onComplete={onExerciseComplete}
      disabled={Boolean(exerciseDisabled || teacherReadOnly)}
      sharedAttempt={sharedAttempt}
    />
  );
}
