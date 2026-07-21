import type { ExerciseItem } from "@/features/lesson/types/Lesson";
import { ConversationExercise } from "@/features/lesson/exercises/conversation/ConversationExercise";
import { FillBlankExercise } from "@/features/lesson/exercises/fillBlank/FillBlankExercise";
import { ListenBuildExercise } from "@/features/lesson/exercises/listenBuild/ListenBuildExercise";
import { ListenFillBlankExercise } from "@/features/lesson/exercises/listenFillBlank/ListenFillBlankExercise";
import { ListenSpeakExercise } from "@/features/lesson/exercises/listenSpeak/ListenSpeakExercise";
import { MatchingExercise } from "@/features/lesson/exercises/matching/MatchingExercise";
import type { StudentAttemptView } from "@/features/realtime/hooks/useLessonAttemptsSync";

type ExerciseRendererProps = {
  item: ExerciseItem;
  lessonId: string;
  lessonTitle: string;
  learningSessionId: string;
  onComplete: () => void;
  disabled?: boolean;
  sharedAttempt?: StudentAttemptView | null;
};

export function ExerciseRenderer({
  item,
  lessonId,
  lessonTitle,
  learningSessionId,
  onComplete,
  disabled,
  sharedAttempt = null
}: ExerciseRendererProps) {
  const conversationSharedResult =
    sharedAttempt?.type === "conversation" &&
    sharedAttempt.transcript &&
    sharedAttempt.feedback &&
    sharedAttempt.scores
      ? {
          transcript: sharedAttempt.transcript,
          scores: sharedAttempt.scores,
          feedback: sharedAttempt.feedback
        }
      : null;

  switch (item.exerciseType) {
    case "conversation":
      return (
        <ConversationExercise
          lessonItemId={item.id}
          lessonId={lessonId}
          lessonTitle={lessonTitle}
          title={item.title}
          question={item.data.question}
          dialogue={item.data.dialogue}
          sampleAnswers={item.data.sampleAnswers}
          expectedTopics={item.data.assessment.expectedTopics}
          learningSessionId={learningSessionId}
          onComplete={onComplete}
          disabled={disabled}
          sharedResult={conversationSharedResult}
        />
      );
    case "fill_in_blank":
      return (
        <FillBlankExercise
          lessonItemId={item.id}
          learningSessionId={learningSessionId}
          title={item.title}
          sentenceBefore={item.data.sentenceBefore}
          sentenceAfter={item.data.sentenceAfter}
          options={item.data.options}
          correctAnswer={item.data.correctAnswer}
          onComplete={onComplete}
          disabled={disabled}
          sharedAttempt={sharedAttempt}
        />
      );
    case "matching":
      return (
        <MatchingExercise
          lessonItemId={item.id}
          learningSessionId={learningSessionId}
          title={item.title}
          pairs={item.data.pairs}
          onComplete={onComplete}
          disabled={disabled}
          sharedAttempt={sharedAttempt}
        />
      );
    case "listen_and_build_sentence":
      return (
        <ListenBuildExercise
          lessonItemId={item.id}
          learningSessionId={learningSessionId}
          title={item.title}
          audioUrl={item.data.audioUrl}
          words={item.data.words}
          correctOrder={item.data.correctOrder}
          onComplete={onComplete}
          disabled={disabled}
          sharedAttempt={sharedAttempt}
        />
      );
    case "listen_and_speak":
      return (
        <ListenSpeakExercise
          lessonItemId={item.id}
          learningSessionId={learningSessionId}
          title={item.title}
          expectedSentence={item.data.expectedSentence}
          audioUrl={item.data.audioUrl}
          onComplete={onComplete}
          disabled={disabled}
          sharedAttempt={sharedAttempt}
        />
      );
    case "listen_and_fill_in_blank":
      return (
        <ListenFillBlankExercise
          lessonItemId={item.id}
          learningSessionId={learningSessionId}
          title={item.title}
          audioUrl={item.data.audioUrl}
          sentenceBefore={item.data.sentenceBefore}
          sentenceAfter={item.data.sentenceAfter}
          options={item.data.options}
          correctAnswer={item.data.correctAnswer}
          onComplete={onComplete}
          disabled={disabled}
          sharedAttempt={sharedAttempt}
        />
      );
    default:
      return null;
  }
}
