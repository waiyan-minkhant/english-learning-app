import { serverEvents } from "@english-learning/contracts/socket/events";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  mockSocket,
  studentUser,
  teacherUser,
  TEST_ROOM_ID
} from "../../../test/helpers.js";

const {
  classFindFirst,
  liveSessionUpdateMany,
  liveSessionCreate,
  liveSessionFindFirst,
  liveSessionUpdate,
  initializePresenceRoom,
  hasPresenceRoom,
  joinPresence,
  leavePresence,
  clearPresenceRoom,
  emitToRoom,
  disconnectRoom
} = vi.hoisted(() => ({
  classFindFirst: vi.fn(),
  liveSessionUpdateMany: vi.fn(),
  liveSessionCreate: vi.fn(),
  liveSessionFindFirst: vi.fn(),
  liveSessionUpdate: vi.fn(),
  initializePresenceRoom: vi.fn(),
  hasPresenceRoom: vi.fn(),
  joinPresence: vi.fn(),
  leavePresence: vi.fn(),
  clearPresenceRoom: vi.fn(),
  emitToRoom: vi.fn(),
  disconnectRoom: vi.fn()
}));

vi.mock("../../../lib/prisma.js", () => ({
  prisma: {
    class: { findFirst: classFindFirst },
    liveSession: {
      updateMany: liveSessionUpdateMany,
      create: liveSessionCreate,
      findFirst: liveSessionFindFirst,
      update: liveSessionUpdate
    }
  }
}));

vi.mock("../../realtime/services/presence.service.js", () => ({
  initializePresenceRoom,
  hasPresenceRoom,
  joinPresence,
  leavePresence,
  clearPresenceRoom
}));

vi.mock("../../realtime/realtime.gateway.js", () => ({
  emitToRoom,
  disconnectRoom
}));

import {
  autoEndSession,
  endSession,
  handleEndSession,
  handleJoinSession,
  handleLeaveSession,
  joinSession,
  startSession
} from "./session.service.js";

const classId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const sessionId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

describe("session.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasPresenceRoom.mockResolvedValue(true);
    initializePresenceRoom.mockResolvedValue(undefined);
    joinPresence.mockResolvedValue(undefined);
    leavePresence.mockResolvedValue(undefined);
    clearPresenceRoom.mockResolvedValue(undefined);
    liveSessionUpdateMany.mockResolvedValue({ count: 0 });
    liveSessionUpdate.mockResolvedValue({});
  });

  describe("startSession", () => {
    it("throws when teacher has no class", async () => {
      classFindFirst.mockResolvedValue(null);

      await expect(startSession(teacherUser().id)).rejects.toThrow(
        "No class assigned to this teacher"
      );
    });

    it("ends live sessions, creates room, and initializes presence", async () => {
      classFindFirst.mockResolvedValue({ id: classId, teacherId: teacherUser().id });
      liveSessionCreate.mockImplementation(
        async (args: { data: { roomId: string } }) => ({
          roomId: args.data.roomId
        })
      );

      const result = await startSession(teacherUser().id);

      expect(liveSessionUpdateMany).toHaveBeenCalledWith({
        where: { classId, status: "live" },
        data: expect.objectContaining({ status: "ended" })
      });
      expect(liveSessionCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          classId,
          status: "live",
          roomId: expect.stringMatching(/^class-[a-z0-9]{8}$/)
        })
      });
      expect(initializePresenceRoom).toHaveBeenCalledWith(result.roomId);
      expect(result.roomId).toMatch(/^class-[a-z0-9]{8}$/);
    });
  });

  describe("joinSession", () => {
    it("throws when student has no class", async () => {
      classFindFirst.mockResolvedValue(null);

      await expect(joinSession(studentUser().id)).rejects.toThrow(
        "No class assigned to this student"
      );
    });

    it("throws when no live session exists", async () => {
      classFindFirst.mockResolvedValue({ id: classId, studentId: studentUser().id });
      liveSessionFindFirst.mockResolvedValue(null);

      await expect(joinSession(studentUser().id)).rejects.toThrow(
        "No live session is available to join"
      );
    });

    it("returns live session response", async () => {
      const startedAt = new Date("2026-01-01T12:00:00.000Z");
      classFindFirst.mockResolvedValue({ id: classId, studentId: studentUser().id });
      liveSessionFindFirst.mockResolvedValue({
        id: sessionId,
        roomId: TEST_ROOM_ID,
        status: "live",
        startedAt,
        endedAt: null,
        classId
      });

      const result = await joinSession(studentUser().id);

      expect(result).toEqual({
        id: sessionId,
        roomId: TEST_ROOM_ID,
        status: "live",
        startedAt: startedAt.toISOString(),
        endedAt: null,
        classId
      });
    });
  });

  describe("endSession", () => {
    it("throws when session is missing or teacher does not own it", async () => {
      liveSessionFindFirst.mockResolvedValue(null);

      await expect(
        endSession(teacherUser().id, TEST_ROOM_ID)
      ).rejects.toThrow("Cannot end this session");

      liveSessionFindFirst.mockResolvedValue({
        id: sessionId,
        roomId: TEST_ROOM_ID,
        status: "live",
        class: { teacherId: "other-teacher-id" }
      });

      await expect(
        endSession(teacherUser().id, TEST_ROOM_ID)
      ).rejects.toThrow("Cannot end this session");
    });

    it("marks session ended", async () => {
      liveSessionFindFirst.mockResolvedValue({
        id: sessionId,
        roomId: TEST_ROOM_ID,
        status: "live",
        class: { teacherId: teacherUser().id }
      });

      await endSession(teacherUser().id, TEST_ROOM_ID);

      expect(liveSessionUpdate).toHaveBeenCalledWith({
        where: { id: sessionId },
        data: expect.objectContaining({ status: "ended" })
      });
    });
  });

  describe("autoEndSession", () => {
    it("no-ops when presence room is missing", async () => {
      hasPresenceRoom.mockResolvedValue(false);

      await autoEndSession(TEST_ROOM_ID, teacherUser().id);

      expect(liveSessionFindFirst).not.toHaveBeenCalled();
      expect(clearPresenceRoom).not.toHaveBeenCalled();
    });

    it("no-ops when session cannot be ended", async () => {
      liveSessionFindFirst.mockResolvedValue(null);

      await autoEndSession(TEST_ROOM_ID, teacherUser().id);

      expect(clearPresenceRoom).not.toHaveBeenCalled();
      expect(disconnectRoom).not.toHaveBeenCalled();
    });

    it("ends session and terminates room for teacher", async () => {
      liveSessionFindFirst.mockResolvedValue({
        id: sessionId,
        roomId: TEST_ROOM_ID,
        status: "live",
        class: { teacherId: teacherUser().id }
      });

      await autoEndSession(TEST_ROOM_ID, teacherUser().id);

      expect(liveSessionUpdate).toHaveBeenCalled();
      expect(clearPresenceRoom).toHaveBeenCalledWith(TEST_ROOM_ID);
      expect(emitToRoom).toHaveBeenCalledWith(
        TEST_ROOM_ID,
        serverEvents.sessionEnded,
        { sessionId: TEST_ROOM_ID }
      );
      expect(disconnectRoom).toHaveBeenCalledWith(TEST_ROOM_ID);
    });
  });

  describe("handleJoinSession", () => {
    it("no-ops without authenticated user", async () => {
      await handleJoinSession(mockSocket(), TEST_ROOM_ID);
      expect(joinPresence).not.toHaveBeenCalled();
    });

    it("no-ops on invalid payload", async () => {
      await handleJoinSession(mockSocket(teacherUser()), "");
      expect(joinPresence).not.toHaveBeenCalled();
    });

    it("no-ops when presence room does not exist", async () => {
      hasPresenceRoom.mockResolvedValue(false);

      await handleJoinSession(mockSocket(teacherUser()), TEST_ROOM_ID);

      expect(joinPresence).not.toHaveBeenCalled();
    });

    it("joins presence for valid payload", async () => {
      const user = teacherUser();
      const socket = mockSocket(user);

      await handleJoinSession(socket, TEST_ROOM_ID);

      expect(joinPresence).toHaveBeenCalledWith(socket, user, TEST_ROOM_ID);
    });
  });

  describe("handleLeaveSession", () => {
    it("no-ops without authenticated user", async () => {
      await handleLeaveSession(mockSocket(), TEST_ROOM_ID);
      expect(leavePresence).not.toHaveBeenCalled();
    });

    it("leaves presence for valid payload", async () => {
      const user = studentUser();
      const socket = mockSocket(user);

      await handleLeaveSession(socket, TEST_ROOM_ID);

      expect(leavePresence).toHaveBeenCalledWith(socket, user, TEST_ROOM_ID);
    });
  });

  describe("handleEndSession", () => {
    it("no-ops for students", async () => {
      await handleEndSession(mockSocket(studentUser()), TEST_ROOM_ID);

      expect(clearPresenceRoom).not.toHaveBeenCalled();
      expect(emitToRoom).not.toHaveBeenCalled();
    });

    it("no-ops when presence room is missing", async () => {
      hasPresenceRoom.mockResolvedValue(false);

      await handleEndSession(mockSocket(teacherUser()), TEST_ROOM_ID);

      expect(clearPresenceRoom).not.toHaveBeenCalled();
    });

    it("no-ops when endSession fails authorization", async () => {
      liveSessionFindFirst.mockResolvedValue(null);

      await handleEndSession(mockSocket(teacherUser()), TEST_ROOM_ID);

      expect(clearPresenceRoom).not.toHaveBeenCalled();
      expect(disconnectRoom).not.toHaveBeenCalled();
    });

    it("terminates session for teacher", async () => {
      liveSessionFindFirst.mockResolvedValue({
        id: sessionId,
        roomId: TEST_ROOM_ID,
        status: "live",
        class: { teacherId: teacherUser().id }
      });

      await handleEndSession(mockSocket(teacherUser()), TEST_ROOM_ID);

      expect(liveSessionUpdate).toHaveBeenCalled();
      expect(clearPresenceRoom).toHaveBeenCalledWith(TEST_ROOM_ID);
      expect(emitToRoom).toHaveBeenCalledWith(
        TEST_ROOM_ID,
        serverEvents.sessionEnded,
        { sessionId: TEST_ROOM_ID }
      );
      expect(disconnectRoom).toHaveBeenCalledWith(TEST_ROOM_ID);
    });
  });
});
