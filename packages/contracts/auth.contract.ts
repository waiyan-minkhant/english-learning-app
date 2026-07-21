import { z } from "zod";

export const userRoleSchema = z.enum(["student", "teacher"]);

export const authCredentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters")
});

export const loginRequestSchema = authCredentialsSchema;

export const authUserSchema = z.object({
  id: z.string().uuid(),
  email: z.email(),
  name: z.string().min(1),
  role: userRoleSchema
});

export const studentUserSchema = authUserSchema.extend({
  role: z.literal("student")
});

export const teacherUserSchema = authUserSchema.extend({
  role: z.literal("teacher")
});

export const authSuccessResponseSchema = z.object({
  user: authUserSchema
});

export type UserRole = z.infer<typeof userRoleSchema>;

export type AuthCredentials = z.infer<typeof authCredentialsSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export type AuthUser = z.infer<typeof authUserSchema>;
export type StudentUser = z.infer<typeof studentUserSchema>;
export type TeacherUser = z.infer<typeof teacherUserSchema>;

export type AuthSuccessResponse = z.infer<typeof authSuccessResponseSchema>;
