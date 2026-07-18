import type { ConversationAssessmentResult } from "@english-learning/contracts/learning";

export type AssessmentContext = {
  lessonId: string;
  exerciseId: string;
  exerciseType: "conversation";
  prompt: string;
  expectedTopics?: string[];
  lessonTitle: string;
  exerciseTitle: string;
  transcript: string;
};

export type AssessmentProvider = {
  assess(context: AssessmentContext): Promise<ConversationAssessmentResult>;
};
