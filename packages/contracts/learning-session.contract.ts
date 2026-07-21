import { z } from "zod";

export const learningSessionModeSchema = z.enum(["solo", "classroom"]);
export const learningSessionStatusSchema = z.enum(["live", "ended"]);

export const learningSessionSchema = z.object({
  id: z.string().uuid(),
  mode: learningSessionModeSchema,
  status: learningSessionStatusSchema,
  lessonId: z.string().min(1),
  currentLessonItemId: z.string().nullable(),
  answerRevealed: z.boolean(),
  startedById: z.string().uuid(),
  liveSessionId: z.string().uuid().nullable(),
  liveSessionRoomId: z.string().nullable().optional(),
  startedAt: z.string(),
  endedAt: z.string().nullable()
});

export const createSoloLearningSessionSchema = z.object({
  lessonId: z.string().min(1)
});

export const createClassroomLearningSessionSchema = z
  .object({
    lessonId: z.string().min(1),
    liveSessionId: z.string().uuid().optional(),
    roomId: z.string().min(1).optional()
  })
  .refine((v) => Boolean(v.liveSessionId || v.roomId), {
    message: "liveSessionId or roomId is required"
  });

export const listLearningSessionsQuerySchema = z.object({
  mode: learningSessionModeSchema.optional(),
  status: learningSessionStatusSchema.optional(),
  lessonId: z.string().min(1).optional(),
  userId: z.string().uuid().optional(),
  roomId: z.string().min(1).optional()
});

export const learningSessionListResponseSchema = z.object({
  sessions: z.array(learningSessionSchema)
});

export const learningSessionResponseSchema = z.object({
  session: learningSessionSchema
});

export const sessionAttemptTypeSchema = z.enum([
  "conversation",
  "fill_in_blank",
  "matching",
  "listen_and_build_sentence",
  "listen_and_speak",
  "listen_and_fill_in_blank"
]);

export const sessionAttemptSchema = z.object({
  id: z.string().uuid(),
  type: sessionAttemptTypeSchema,
  userId: z.string().uuid(),
  lessonItemId: z.string().min(1),
  learningSessionId: z.string().uuid(),
  createdAt: z.string(),
  correct: z.boolean().optional(),
  selectedAnswer: z.string().optional(),
  submittedOrder: z.array(z.string()).optional(),
  selectedPairs: z.record(z.string(), z.string()).optional(),
  transcript: z.string().optional(),
  feedback: z.string().optional(),
  pronunciationScore: z.number().int().nullable().optional(),
  scores: z
    .object({
      answeredQuestion: z.number().int(),
      grammar: z.number().int(),
      vocabulary: z.number().int(),
      sentenceCompleteness: z.number().int()
    })
    .optional()
});

export const learningSessionAttemptsResponseSchema = z.object({
  attempts: z.array(sessionAttemptSchema)
});

export type LearningSessionMode = z.infer<typeof learningSessionModeSchema>;
export type LearningSessionStatus = z.infer<typeof learningSessionStatusSchema>;
export type LearningSession = z.infer<typeof learningSessionSchema>;
export type CreateSoloLearningSession = z.infer<
  typeof createSoloLearningSessionSchema
>;
export type CreateClassroomLearningSession = z.infer<
  typeof createClassroomLearningSessionSchema
>;
export type ListLearningSessionsQuery = z.infer<
  typeof listLearningSessionsQuerySchema
>;
export type SessionAttempt = z.infer<typeof sessionAttemptSchema>;
