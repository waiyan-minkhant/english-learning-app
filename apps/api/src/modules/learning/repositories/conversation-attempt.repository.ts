import { prisma } from "../../../lib/prisma.js";

export type CreateConversationAttemptInput = {
  userId: string;
  lessonId: string;
  exerciseId: string;
  sessionId?: string;
  transcript: string;
  answeredQuestion: number;
  grammar: number;
  vocabulary: number;
  sentenceCompleteness: number;
  feedback: string;
};

export class ConversationAttemptRepository {
  create(input: CreateConversationAttemptInput) {
    return prisma.conversationAttempt.create({
      data: {
        userId: input.userId,
        lessonId: input.lessonId,
        exerciseId: input.exerciseId,
        sessionId: input.sessionId,
        transcript: input.transcript,
        answeredQuestion: input.answeredQuestion,
        grammar: input.grammar,
        vocabulary: input.vocabulary,
        sentenceCompleteness: input.sentenceCompleteness,
        feedback: input.feedback
      }
    });
  }
}
