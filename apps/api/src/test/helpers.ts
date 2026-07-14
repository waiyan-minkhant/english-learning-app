import type { AuthUser } from "@english-learning/contracts";
import type { Socket } from "socket.io";
import { vi } from "vitest";

export const TEST_ROOM_ID = "class-testroom1";

const TEACHER_ID = "11111111-1111-4111-8111-111111111111";
const STUDENT_ID = "22222222-2222-4222-8222-222222222222";

export function teacherUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: TEACHER_ID,
    email: "teacher@example.com",
    name: "Clair",
    role: "teacher",
    ...overrides
  };
}

export function studentUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: STUDENT_ID,
    email: "student@example.com",
    name: "Aung Aung",
    role: "student",
    ...overrides
  };
}

export function mockSocket(
  user?: AuthUser,
  socketId = "socket-1"
): Socket & { join: ReturnType<typeof vi.fn>; leave: ReturnType<typeof vi.fn> } {
  return {
    id: socketId,
    data: user ? { user } : {},
    join: vi.fn(),
    leave: vi.fn()
  } as Socket & { join: ReturnType<typeof vi.fn>; leave: ReturnType<typeof vi.fn> };
}
