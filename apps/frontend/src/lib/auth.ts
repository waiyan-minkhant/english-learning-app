import { z } from "zod";
import {
  authCredentialsSchema,
  authSuccessResponseSchema,
  authUserSchema,
  loginRequestSchema,
  registerRequestSchema,
  type AuthCredentials,
  type AuthSuccessResponse,
  type AuthUser,
  type LoginRequest,
  type RegisterRequest,
  type UserRole
} from "@english-learning/contracts";

export const authMeResponseSchema = z.object({
  user: authUserSchema
});

export type AuthMeResponse = z.infer<typeof authMeResponseSchema>;
export type SessionUser = AuthMeResponse["user"];

export {
  authCredentialsSchema,
  loginRequestSchema,
  registerRequestSchema,
  authSuccessResponseSchema,
  type AuthCredentials,
  type LoginRequest,
  type RegisterRequest,
  type AuthSuccessResponse,
  type AuthUser,
  type UserRole
};

export function parseLoginRequest(data: unknown): LoginRequest {
  return loginRequestSchema.parse(data);
}

export function parseRegisterRequest(data: unknown): RegisterRequest {
  return registerRequestSchema.parse(data);
}

export function parseAuthMeResponse(data: unknown): AuthMeResponse {
  return authMeResponseSchema.parse(data);
}

export function parseAuthSuccessResponse(data: unknown): AuthSuccessResponse {
  return authSuccessResponseSchema.parse(data);
}
