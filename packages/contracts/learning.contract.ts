import { z } from "zod";

const scoreSchema = z.number().int().min(1).max(5);
const learningSessionIdSchema = z.string().uuid();

export const conversationScoresSchema = z.object({
  answeredQuestion: scoreSchema,
  grammar: scoreSchema,
  vocabulary: scoreSchema,
  sentenceCompleteness: scoreSchema
});

/** Multipart form fields (excluding the audio file). */
export const conversationAttemptFieldsSchema = z.object({
  lessonItemId: z.string().min(1),
  lessonId: z.string().min(1),
  learningSessionId: learningSessionIdSchema
});

export const conversationAttemptResponseSchema = z.object({
  attemptId: z.string().uuid(),
  transcript: z.string(),
  scores: conversationScoresSchema,
  feedback: z.string(),
  progress: z
    .object({
      lessonId: z.string(),
      currentItemId: z.string().nullable(),
      status: z.enum(["not_started", "in_progress", "completed"])
    })
    .optional()
});

export const conversationAssessmentResultSchema = z.object({
  answeredQuestion: scoreSchema,
  grammar: scoreSchema,
  vocabulary: scoreSchema,
  sentenceCompleteness: scoreSchema,
  feedback: z.string().min(1),
  transcript: z.string().optional()
});

export const fillBlankAttemptFieldsSchema = z.object({
  lessonItemId: z.string().min(1),
  learningSessionId: learningSessionIdSchema,
  selectedAnswer: z.string().min(1)
});

export const listenFillBlankAttemptFieldsSchema = fillBlankAttemptFieldsSchema;

export const listenBuildAttemptFieldsSchema = z.object({
  lessonItemId: z.string().min(1),
  learningSessionId: learningSessionIdSchema,
  submittedOrder: z.array(z.string().min(1)).min(1)
});

export const matchingAttemptFieldsSchema = z.object({
  lessonItemId: z.string().min(1),
  learningSessionId: learningSessionIdSchema,
  selectedPairs: z.record(z.string(), z.string())
});

export const listenSpeakAttemptFieldsSchema = z.object({
  lessonItemId: z.string().min(1),
  learningSessionId: learningSessionIdSchema,
  transcript: z.string().min(1).optional()
});

export const completeContentItemFieldsSchema = z.object({
  learningSessionId: learningSessionIdSchema
});

export const scoredAttemptResponseSchema = z.object({
  attemptId: z.string().uuid(),
  correct: z.boolean(),
  progress: z.object({
    lessonId: z.string(),
    currentItemId: z.string().nullable(),
    status: z.enum(["not_started", "in_progress", "completed"])
  })
});

export type ConversationScores = z.infer<typeof conversationScoresSchema>;
export type ConversationAttemptFields = z.infer<
  typeof conversationAttemptFieldsSchema
>;
export type ConversationAttemptResponse = z.infer<
  typeof conversationAttemptResponseSchema
>;
export type ConversationAssessmentResult = z.infer<
  typeof conversationAssessmentResultSchema
>;
export type FillBlankAttemptFields = z.infer<typeof fillBlankAttemptFieldsSchema>;
export type ListenBuildAttemptFields = z.infer<
  typeof listenBuildAttemptFieldsSchema
>;
export type MatchingAttemptFields = z.infer<typeof matchingAttemptFieldsSchema>;
export type ListenSpeakAttemptFields = z.infer<
  typeof listenSpeakAttemptFieldsSchema
>;
export type CompleteContentItemFields = z.infer<
  typeof completeContentItemFieldsSchema
>;
export type ScoredAttemptResponse = z.infer<typeof scoredAttemptResponseSchema>;
