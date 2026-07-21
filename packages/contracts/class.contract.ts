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

export const classStudentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email()
});

/** Teacher's class with roster for history / solo filtering. */
export const teacherClassRosterSchema = z.object({
  id: z.string().uuid(),
  teacherId: z.string().uuid(),
  lessonId: z.string().min(1),
  students: z.array(classStudentSchema)
});

export const teacherClassRosterResponseSchema = z.object({
  class: teacherClassRosterSchema
});

export type Class = z.infer<typeof classSchema>;
export type ClassCreate = z.infer<typeof classCreateSchema>;
export type ClassWithSessions = z.infer<typeof classWithSessionsSchema>;
export type ClassStudent = z.infer<typeof classStudentSchema>;
export type TeacherClassRoster = z.infer<typeof teacherClassRosterSchema>;
