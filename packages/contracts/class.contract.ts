import { z } from "zod";
import { realtimeSessionSchema } from "@english-learning/contracts/realtime";

export const classSchema = z.object({
  id: z.string().uuid(),
  teacherId: z.string().uuid(),
  studentIds: z.array(z.string().uuid()),
  lessonId: z.string().uuid(),
  sessions: z.array(realtimeSessionSchema)
});

export const classCreateSchema = z.object({
  teacherId: z.string().uuid(),
  studentIds: z.array(z.string().uuid()).min(1),
  lessonId: z.string().uuid()
});

export const classWithSessionsSchema = classSchema;

export type Class = z.infer<typeof classSchema>;
export type ClassCreate = z.infer<typeof classCreateSchema>;
export type ClassWithSessions = z.infer<typeof classWithSessionsSchema>;
