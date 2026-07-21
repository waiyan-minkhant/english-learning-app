import type { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma.js";

export type CreateConversationAttemptInput = {
  userId: string;
  lessonId: string;
  lessonItemId: string;
  learningSessionId: string;
  transcript: string;
  answeredQuestion: number;
  grammar: number;
  vocabulary: number;
  sentenceCompleteness: number;
  feedback: string;
};

export class ConversationAttemptRepository {
  create(input: CreateConversationAttemptInput) {
    const data = {
      userId: input.userId,
      lessonId: input.lessonId,
      lessonItemId: input.lessonItemId,
      learningSessionId: input.learningSessionId,
      transcript: input.transcript,
      answeredQuestion: input.answeredQuestion,
      grammar: input.grammar,
      vocabulary: input.vocabulary,
      sentenceCompleteness: input.sentenceCompleteness,
      feedback: input.feedback
    } as Prisma.ConversationAttemptUncheckedCreateInput;

    return prisma.conversationAttempt.create({ data });
  }
}
