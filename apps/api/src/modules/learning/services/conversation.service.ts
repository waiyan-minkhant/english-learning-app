import type { ConversationAttemptResponse } from "@english-learning/contracts/learning";
import { prisma } from "../../../lib/prisma.js";
import { ConflictError } from "../../../shared/errors/conflict-error.js";
import { NotFoundError } from "../../../shared/errors/not-found-error.js";
import type { AssessmentProvider } from "../providers/assessment.provider.js";
import { AssemblyAISpeechProvider } from "../providers/assemblyai-speech.provider.js";
import { GroqAssessmentProvider } from "../providers/groq-assessment.provider.js";
import type { SpeechProvider } from "../providers/speech.provider.js";
import { ConversationAttemptRepository } from "../repositories/conversation-attempt.repository.js";

export type EvaluateAttemptInput = {
  userId: string;
  audio: Buffer;
  mimeType: string;
  exerciseId: string;
  lessonId: string;
  sessionId?: string;
  lessonTitle: string;
  exerciseTitle: string;
  question: string;
  expectedTopics?: string[];
};

export class ConversationService {
  constructor(
    private readonly speechProvider: SpeechProvider,
    private readonly assessmentProvider: AssessmentProvider,
    private readonly attemptRepository: ConversationAttemptRepository
  ) {}

  async evaluateAttempt(
    input: EvaluateAttemptInput
  ): Promise<ConversationAttemptResponse> {
    let resolvedSessionId: string | undefined;

    if (input.sessionId) {
      resolvedSessionId = await this.assertSessionAcceptsAttempts(
        input.sessionId
      );
    }

    const transcript = await this.speechProvider.transcribe(
      input.audio,
      input.mimeType
    );

    const assessment = await this.assessmentProvider.assess({
      lessonId: input.lessonId,
      exerciseId: input.exerciseId,
      exerciseType: "conversation",
      prompt: input.question,
      expectedTopics: input.expectedTopics,
      lessonTitle: input.lessonTitle,
      exerciseTitle: input.exerciseTitle,
      transcript
    });

    const attempt = await this.attemptRepository.create({
      userId: input.userId,
      lessonId: input.lessonId,
      exerciseId: input.exerciseId,
      sessionId: resolvedSessionId,
      transcript: assessment.transcript ?? transcript,
      answeredQuestion: assessment.answeredQuestion,
      grammar: assessment.grammar,
      vocabulary: assessment.vocabulary,
      sentenceCompleteness: assessment.sentenceCompleteness,
      feedback: assessment.feedback
    });

    return {
      attemptId: attempt.id,
      transcript: attempt.transcript,
      scores: {
        answeredQuestion: attempt.answeredQuestion,
        grammar: attempt.grammar,
        vocabulary: attempt.vocabulary,
        sentenceCompleteness: attempt.sentenceCompleteness
      },
      feedback: attempt.feedback
    };
  }

  private async assertSessionAcceptsAttempts(sessionId: string) {
    const session = await prisma.liveSession.findFirst({
      where: {
        OR: [{ id: sessionId }, { roomId: sessionId }]
      },
      select: { id: true, status: true }
    });

    if (!session) {
      throw new NotFoundError("Session not found");
    }

    if (session.status === "ended") {
      throw new ConflictError("Session has ended");
    }

    return session.id;
  }
}

let defaultConversationService: ConversationService | null = null;

export function getConversationService() {
  if (!defaultConversationService) {
    defaultConversationService = new ConversationService(
      new AssemblyAISpeechProvider(),
      new GroqAssessmentProvider(),
      new ConversationAttemptRepository()
    );
  }
  return defaultConversationService;
}
