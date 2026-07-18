import { z } from "zod";

const scoreSchema = z.number().int().min(1).max(5);

export const conversationScoresSchema = z.object({
  answeredQuestion: scoreSchema,
  grammar: scoreSchema,
  vocabulary: scoreSchema,
  sentenceCompleteness: scoreSchema
});

/** Multipart form fields (excluding the audio file). */
export const conversationAttemptFieldsSchema = z.object({
  exerciseId: z.string().min(1),
  lessonId: z.string().min(1),
  sessionId: z.string().min(1).optional(),
  lessonTitle: z.string().min(1),
  exerciseTitle: z.string().min(1),
  question: z.string().min(1),
  expectedTopics: z
    .string()
    .optional()
    .transform((value) => {
      if (!value?.trim()) return undefined;
      try {
        const parsed: unknown = JSON.parse(value);
        if (
          Array.isArray(parsed) &&
          parsed.every((item) => typeof item === "string")
        ) {
          return parsed as string[];
        }
      } catch {
        // fall through to comma-separated
      }
      return value
        .split(",")
        .map((topic) => topic.trim())
        .filter(Boolean);
    })
});

export const conversationAttemptResponseSchema = z.object({
  attemptId: z.string().uuid(),
  transcript: z.string(),
  scores: conversationScoresSchema,
  feedback: z.string()
});

export const conversationAssessmentResultSchema = z.object({
  answeredQuestion: scoreSchema,
  grammar: scoreSchema,
  vocabulary: scoreSchema,
  sentenceCompleteness: scoreSchema,
  feedback: z.string().min(1),
  transcript: z.string().optional()
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
