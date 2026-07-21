import { z } from "zod";

export const exerciseTypeSchema = z.enum([
  "conversation",
  "fill_in_blank",
  "matching",
  "listen_and_build_sentence",
  "listen_and_speak",
  "listen_and_fill_in_blank"
]);

export const contentTypeSchema = z.enum(["knowledge", "demo_complete"]);

export const difficultySchema = z.enum(["easy", "medium", "hard"]);

export const dialogueLineSchema = z.object({
  text: z.string().min(1),
  audioUrl: z.string().optional()
});

export const matchingPairSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1)
});

export const contentImageSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1)
});

export const conversationAssessmentCriteriaSchema = z.enum([
  "answeredQuestion",
  "grammar",
  "vocabulary",
  "sentenceCompleteness"
]);

export const conversationAssessmentSchema = z.object({
  criteria: z.array(conversationAssessmentCriteriaSchema).min(1),
  expectedTopics: z.array(z.string().min(1)).optional()
});

export const conversationDataSchema = z.object({
  instruction: z.string().optional(),
  question: z.string().min(1),
  dialogue: z.array(dialogueLineSchema).min(1),
  sampleAnswers: z.array(z.string().min(1)).optional(),
  assessment: conversationAssessmentSchema
});

export const fillInBlankDataSchema = z.object({
  instruction: z.string().optional(),
  sentenceBefore: z.string(),
  sentenceAfter: z.string(),
  options: z.array(z.string().min(1)).min(1),
  correctAnswer: z.string().min(1)
});

export const listenAndBuildSentenceDataSchema = z.object({
  instruction: z.string().optional(),
  audioUrl: z.string().optional(),
  words: z.array(z.string().min(1)).min(1),
  correctOrder: z.array(z.string().min(1)).min(1)
});

export const listenAndFillInBlankDataSchema = z.object({
  instruction: z.string().optional(),
  audioUrl: z.string().optional(),
  sentenceBefore: z.string(),
  sentenceAfter: z.string(),
  options: z.array(z.string().min(1)).min(1),
  correctAnswer: z.string().min(1)
});

export const matchingDataSchema = z.object({
  instruction: z.string().optional(),
  pairs: z.array(matchingPairSchema).min(1)
});

export const listenAndSpeakDataSchema = z.object({
  instruction: z.string().optional(),
  expectedSentence: z.string().min(1),
  audioUrl: z.string().optional()
});

export const knowledgeMediaSchema = z.object({
  audio: z.string().optional(),
  images: z.array(contentImageSchema).optional()
});

export const knowledgeDataSchema = z.object({
  body: z.string().min(1),
  media: knowledgeMediaSchema.optional()
});

export const demoCompleteDataSchema = z.object({}).strict();

const lessonItemBaseSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().positive(),
  title: z.string().min(1),
  difficulty: difficultySchema
});

export const conversationItemSchema = lessonItemBaseSchema.extend({
  type: z.literal("exercise"),
  exerciseType: z.literal("conversation"),
  data: conversationDataSchema
});

export const fillInBlankItemSchema = lessonItemBaseSchema.extend({
  type: z.literal("exercise"),
  exerciseType: z.literal("fill_in_blank"),
  data: fillInBlankDataSchema
});

export const matchingItemSchema = lessonItemBaseSchema.extend({
  type: z.literal("exercise"),
  exerciseType: z.literal("matching"),
  data: matchingDataSchema
});

export const listenAndBuildSentenceItemSchema = lessonItemBaseSchema.extend({
  type: z.literal("exercise"),
  exerciseType: z.literal("listen_and_build_sentence"),
  data: listenAndBuildSentenceDataSchema
});

export const listenAndSpeakItemSchema = lessonItemBaseSchema.extend({
  type: z.literal("exercise"),
  exerciseType: z.literal("listen_and_speak"),
  data: listenAndSpeakDataSchema
});

export const listenAndFillInBlankItemSchema = lessonItemBaseSchema.extend({
  type: z.literal("exercise"),
  exerciseType: z.literal("listen_and_fill_in_blank"),
  data: listenAndFillInBlankDataSchema
});

export const knowledgeItemSchema = lessonItemBaseSchema.extend({
  type: z.literal("content"),
  contentType: z.literal("knowledge"),
  data: knowledgeDataSchema
});

export const demoCompleteItemSchema = lessonItemBaseSchema.extend({
  type: z.literal("content"),
  contentType: z.literal("demo_complete"),
  data: demoCompleteDataSchema
});

export const exerciseItemSchema = z.discriminatedUnion("exerciseType", [
  conversationItemSchema,
  fillInBlankItemSchema,
  matchingItemSchema,
  listenAndBuildSentenceItemSchema,
  listenAndSpeakItemSchema,
  listenAndFillInBlankItemSchema
]);

export const contentItemSchema = z.discriminatedUnion("contentType", [
  knowledgeItemSchema,
  demoCompleteItemSchema
]);

export const lessonItemSchema = z.union([
  exerciseItemSchema,
  contentItemSchema
]);

export const lessonSchema = z.object({
  id: z.string().min(1),
  number: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
  estimatedMinutes: z.number().positive(),
  items: z.array(lessonItemSchema).min(1)
});

export const courseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  level: z.string().min(1),
  lessons: z.array(lessonSchema).min(1)
});

export const lessonSummarySchema = z.object({
  id: z.string().min(1),
  number: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
  estimatedMinutes: z.number().positive()
});

export const courseWithLessonSummariesSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  level: z.string().min(1),
  lessons: z.array(lessonSummarySchema)
});

export const lessonProgressStatusSchema = z.enum([
  "not_started",
  "in_progress",
  "completed"
]);

export const userLessonProgressSchema = z.object({
  lessonId: z.string().min(1),
  currentItemId: z.string().nullable(),
  status: lessonProgressStatusSchema,
  startedAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  lastAccessedAt: z.string().datetime()
});

export const getLessonResponseSchema = z.object({
  lesson: lessonSchema,
  progress: userLessonProgressSchema
});

export type ExerciseType = z.infer<typeof exerciseTypeSchema>;
export type ContentType = z.infer<typeof contentTypeSchema>;
export type Difficulty = z.infer<typeof difficultySchema>;
export type DialogueLine = z.infer<typeof dialogueLineSchema>;
export type MatchingPair = z.infer<typeof matchingPairSchema>;
export type ContentImage = z.infer<typeof contentImageSchema>;
export type ConversationData = z.infer<typeof conversationDataSchema>;
export type FillInBlankData = z.infer<typeof fillInBlankDataSchema>;
export type ListenAndBuildSentenceData = z.infer<
  typeof listenAndBuildSentenceDataSchema
>;
export type ListenAndFillInBlankData = z.infer<
  typeof listenAndFillInBlankDataSchema
>;
export type MatchingData = z.infer<typeof matchingDataSchema>;
export type ListenAndSpeakData = z.infer<typeof listenAndSpeakDataSchema>;
export type KnowledgeData = z.infer<typeof knowledgeDataSchema>;
export type DemoCompleteData = z.infer<typeof demoCompleteDataSchema>;
export type ExerciseItem = z.infer<typeof exerciseItemSchema>;
export type ContentItem = z.infer<typeof contentItemSchema>;
export type LessonItem = z.infer<typeof lessonItemSchema>;
export type Lesson = z.infer<typeof lessonSchema>;
export type Course = z.infer<typeof courseSchema>;
export type LessonSummary = z.infer<typeof lessonSummarySchema>;
export type CourseWithLessonSummaries = z.infer<
  typeof courseWithLessonSummariesSchema
>;
export type LessonProgressStatus = z.infer<typeof lessonProgressStatusSchema>;
export type UserLessonProgress = z.infer<typeof userLessonProgressSchema>;
export type GetLessonResponse = z.infer<typeof getLessonResponseSchema>;

/** Sort lesson items by `order` ascending. */
export function sortLessonItems<T extends { order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order);
}
