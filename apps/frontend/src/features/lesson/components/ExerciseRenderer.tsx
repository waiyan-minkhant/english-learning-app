import type { ExerciseStep } from "@/features/lesson/types/Lesson";
import { ConversationExercise } from "@/features/lesson/exercises/conversation/ConversationExercise";
import { FillBlankExercise } from "@/features/lesson/exercises/fillBlank/FillBlankExercise";
import { ListenBuildExercise } from "@/features/lesson/exercises/listenBuild/ListenBuildExercise";
import { ListenSpeakExercise } from "@/features/lesson/exercises/listenSpeak/ListenSpeakExercise";
import { MatchingExercise } from "@/features/lesson/exercises/matching/MatchingExercise";

type ExerciseRendererProps = {
  step: ExerciseStep;
  lessonId: string;
  lessonTitle: string;
  sessionId?: string;
  onComplete: () => void;
  disabled?: boolean;
};

export function ExerciseRenderer({
  step,
  lessonId,
  lessonTitle,
  sessionId,
  onComplete,
  disabled
}: ExerciseRendererProps) {
  switch (step.exerciseType) {
    case "conversation":
      return (
        <ConversationExercise
          exerciseId={step.id}
          lessonId={lessonId}
          lessonTitle={lessonTitle}
          title={step.title}
          prompt={step.prompt}
          dialogueLines={step.dialogueLines}
          aiSuggestions={step.aiSuggestions}
          expectedTopics={step.expectedTopics}
          sessionId={sessionId}
          onComplete={onComplete}
          disabled={disabled}
        />
      );
    case "fill_in_blank":
      return (
        <FillBlankExercise
          title={step.title}
          onComplete={onComplete}
          disabled={disabled}
        />
      );
    case "matching":
      return (
        <MatchingExercise
          title={step.title}
          onComplete={onComplete}
          disabled={disabled}
        />
      );
    case "listen_and_build_sentence":
      return (
        <ListenBuildExercise
          title={step.title}
          onComplete={onComplete}
          disabled={disabled}
        />
      );
    case "listen_and_speak":
      return (
        <ListenSpeakExercise
          title={step.title}
          onComplete={onComplete}
          disabled={disabled}
        />
      );
    default:
      return null;
  }
}
