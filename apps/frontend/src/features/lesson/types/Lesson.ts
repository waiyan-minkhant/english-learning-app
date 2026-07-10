import { z } from "zod";

export const exerciseTypeSchema = z.enum([
  "conversation",
  "fill_in_blank",
  "matching",
  "listen_and_build_sentence",
  "listen_and_speak"
]);

export const contentTypeSchema = z.enum(["knowledge"]);

export const exerciseStepSchema = z.object({
  id: z.string(),
  type: z.literal("exercise"),
  exerciseType: exerciseTypeSchema,
  title: z.string().optional()
});

export const contentStepSchema = z.object({
  id: z.string(),
  type: z.literal("content"),
  contentType: contentTypeSchema,
  title: z.string().optional()
});

export const stepSchema = z.discriminatedUnion("type", [
  exerciseStepSchema,
  contentStepSchema
]);

export const lessonSchema = z.object({
  id: z.string(),
  number: z.number().optional(),
  listTitle: z.string().optional(),
  title: z.string(),
  description: z.string(),
  estimatedMinutes: z.number(),
  steps: z.array(stepSchema)
});

export const courseSchema = z.object({
  courseId: z.string(),
  title: z.string(),
  level: z.string(),
  welcomeTitle: z.string().optional(),
  welcomeSubtitle: z.string().optional(),
  lessons: z.array(lessonSchema)
});

export type ExerciseType = z.infer<typeof exerciseTypeSchema>;
export type ContentType = z.infer<typeof contentTypeSchema>;
export type ExerciseStep = z.infer<typeof exerciseStepSchema>;
export type ContentStep = z.infer<typeof contentStepSchema>;
export type Step = z.infer<typeof stepSchema>;
export type Lesson = z.infer<typeof lessonSchema>;
export type Course = z.infer<typeof courseSchema>;
