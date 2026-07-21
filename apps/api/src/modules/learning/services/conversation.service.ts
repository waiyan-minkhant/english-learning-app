import type { ConversationAttemptResponse } from "@english-learning/contracts/learning";
import { NotFoundError } from "../../../shared/errors/not-found-error.js";
import type { AssessmentProvider } from "../providers/assessment.provider.js";
import { AssemblyAISpeechProvider } from "../providers/assemblyai-speech.provider.js";
import { GroqAssessmentProvider } from "../providers/groq-assessment.provider.js";
import type { SpeechProvider } from "../providers/speech.provider.js";
import { ConversationAttemptRepository } from "../repositories/conversation-attempt.repository.js";
import { LessonRepository } from "../repositories/lesson.repository.js";
import { broadcastAttemptSubmitted } from "./attempt-broadcast.js";
import { getLearningSessionService } from "./learning-session.service.js";
import {
  ProgressService,
  toProgressContract
} from "./progress.service.js";

export type EvaluateAttemptInput = {
  userId: string;
  audio: Buffer;
  mimeType: string;
  lessonItemId: string;
  lessonId: string;
  learningSessionId: string;
};

export class ConversationService {
  constructor(
    private readonly speechProvider: SpeechProvider,
    private readonly assessmentProvider: AssessmentProvider,
    private readonly attemptRepository: ConversationAttemptRepository,
    private readonly lessonRepository = new LessonRepository(),
    private readonly progressService = new ProgressService()
  ) {}

  async evaluateAttempt(
    input: EvaluateAttemptInput
  ): Promise<ConversationAttemptResponse> {
    const session = await getLearningSessionService().assertCanSubmitAttempt(
      input.userId,
      input.learningSessionId,
      input.lessonItemId,
      input.lessonId
    );

    const item = await this.lessonRepository.findItemById(input.lessonItemId);
    if (!item?.conversationExercise || item.lessonId !== input.lessonId) {
      throw new NotFoundError("Conversation exercise not found");
    }

    const exercise = item.conversationExercise;
    const expectedTopics = Array.isArray(exercise.expectedTopics)
      ? (exercise.expectedTopics as string[])
      : undefined;

    const transcript = await this.speechProvider.transcribe(
      input.audio,
      input.mimeType
    );

    const assessment = await this.assessmentProvider.assess({
      lessonId: input.lessonId,
      exerciseId: input.lessonItemId,
      exerciseType: "conversation",
      prompt: exercise.question,
      expectedTopics,
      lessonTitle: item.lesson.title,
      exerciseTitle: item.title,
      transcript
    });

    const attempt = await this.attemptRepository.create({
      userId: input.userId,
      lessonId: input.lessonId,
      lessonItemId: input.lessonItemId,
      learningSessionId: input.learningSessionId,
      transcript: assessment.transcript ?? transcript,
      answeredQuestion: assessment.answeredQuestion,
      grammar: assessment.grammar,
      vocabulary: assessment.vocabulary,
      sentenceCompleteness: assessment.sentenceCompleteness,
      feedback: assessment.feedback
    });

    broadcastAttemptSubmitted(session, {
      lessonItemId: input.lessonItemId,
      userId: input.userId,
      attemptId: attempt.id,
      type: "conversation",
      transcript: attempt.transcript,
      feedback: attempt.feedback,
      scores: {
        answeredQuestion: attempt.answeredQuestion,
        grammar: attempt.grammar,
        vocabulary: attempt.vocabulary,
        sentenceCompleteness: attempt.sentenceCompleteness
      },
      createdAt: attempt.createdAt.toISOString()
    });

    const progress =
      session.mode === "solo"
        ? await this.progressService.ensure(input.userId, input.lessonId)
        : await this.progressService.completeItem(
            input.userId,
            input.lessonId,
            input.lessonItemId
          );
    const progressContract = toProgressContract(progress);

    return {
      attemptId: attempt.id,
      transcript: attempt.transcript,
      scores: {
        answeredQuestion: attempt.answeredQuestion,
        grammar: attempt.grammar,
        vocabulary: attempt.vocabulary,
        sentenceCompleteness: attempt.sentenceCompleteness
      },
      feedback: attempt.feedback,
      progress: {
        lessonId: progressContract.lessonId,
        currentItemId: progressContract.currentItemId,
        status: progressContract.status
      }
    };
  }
}

let conversationService: ConversationService | null = null;

export function getConversationService() {
  if (!conversationService) {
    conversationService = new ConversationService(
      new AssemblyAISpeechProvider(),
      new GroqAssessmentProvider(),
      new ConversationAttemptRepository()
    );
  }
  return conversationService;
}
