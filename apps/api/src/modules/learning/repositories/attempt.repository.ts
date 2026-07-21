import { prisma } from "../../../lib/prisma.js";

export class AttemptRepository {
  createFillBlank(input: {
    userId: string;
    lessonItemId: string;
    learningSessionId: string;
    selectedAnswer: string;
    correct: boolean;
  }) {
    return prisma.fillBlankAttempt.create({ data: input });
  }

  createListenFillBlank(input: {
    userId: string;
    lessonItemId: string;
    learningSessionId: string;
    selectedAnswer: string;
    correct: boolean;
  }) {
    return prisma.listenFillBlankAttempt.create({ data: input });
  }

  createListenBuild(input: {
    userId: string;
    lessonItemId: string;
    learningSessionId: string;
    submittedOrder: string[];
    correct: boolean;
  }) {
    return prisma.listenBuildSentenceAttempt.create({
      data: {
        userId: input.userId,
        lessonItemId: input.lessonItemId,
        learningSessionId: input.learningSessionId,
        submittedOrder: input.submittedOrder,
        correct: input.correct
      }
    });
  }

  createMatching(input: {
    userId: string;
    lessonItemId: string;
    learningSessionId: string;
    selectedPairs: Record<string, string>;
    correct: boolean;
  }) {
    return prisma.matchingAttempt.create({
      data: {
        userId: input.userId,
        lessonItemId: input.lessonItemId,
        learningSessionId: input.learningSessionId,
        selectedPairs: input.selectedPairs,
        correct: input.correct
      }
    });
  }

  createListenSpeak(input: {
    userId: string;
    lessonItemId: string;
    learningSessionId: string;
    transcript: string;
    pronunciationScore?: number;
    feedback: string;
  }) {
    return prisma.listenSpeakAttempt.create({ data: input });
  }
}
