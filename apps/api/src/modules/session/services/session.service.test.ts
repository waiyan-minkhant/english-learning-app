import { clientEvents, serverEvents } from "@english-learning/contracts/socket/events";
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
  disconnectRoom,
  emitSocketError,
  clearParticipantControls,
  ensureParticipantControlsForUser,
  getJoinControlsSnapshot,
  broadcastParticipantControls
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
  disconnectRoom: vi.fn(),
  emitSocketError: vi.fn(),
  clearParticipantControls: vi.fn(),
  ensureParticipantControlsForUser: vi.fn(),
  getJoinControlsSnapshot: vi.fn(),
  broadcastParticipantControls: vi.fn()
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
  disconnectRoom,
  emitSocketError
}));

vi.mock("./participant-controls.service.js", () => ({
  clearParticipantControls,
  ensureParticipantControlsForUser,
  getJoinControlsSnapshot,
  broadcastParticipantControls
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
    clearParticipantControls.mockResolvedValue(undefined);
    ensureParticipantControlsForUser.mockResolvedValue(undefined);
    getJoinControlsSnapshot.mockResolvedValue({
      participantControls: {}
    });
    broadcastParticipantControls.mockResolvedValue(undefined);
    liveSessionUpdateMany.mockResolvedValue({ count: 0 });
    liveSessionUpdate.mockResolvedValue({});
    liveSessionFindFirst.mockResolvedValue({ id: sessionId });
  });

  describe("startSession", () => {
    it("throws when teacher has no class", async () => {
      classFindFirst.mockResolvedValue(null);

      await expect(startSession(teacherUser().id)).rejects.toThrow(
        "No class assigned to this teacher"
      );
    });

    it("ends live sessions, creates room, and initializes presence", async () => {
      classFindFirst.mockResolvedValue({
        id: classId,
        teacherId: teacherUser().id
      });
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
      classFindFirst.mockResolvedValue({ id: classId });
      liveSessionFindFirst.mockResolvedValue(null);

      await expect(joinSession(studentUser().id)).rejects.toThrow(
        "No live session is available to join"
      );
    });

    it("returns live session response", async () => {
      const startedAt = new Date("2026-01-01T12:00:00.000Z");
      classFindFirst.mockResolvedValue({ id: classId });
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
      expect(clearParticipantControls).toHaveBeenCalledWith(TEST_ROOM_ID);
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
      const ack = vi.fn();
      await handleJoinSession(
        mockSocket(),
        { sessionId: TEST_ROOM_ID },
        ack
      );
      expect(joinPresence).not.toHaveBeenCalled();
      expect(ack).toHaveBeenCalledWith({ error: "UNAUTHORIZED" });
    });

    it("no-ops on invalid payload", async () => {
      const ack = vi.fn();
      await handleJoinSession(mockSocket(teacherUser()), "", ack);
      expect(joinPresence).not.toHaveBeenCalled();
      expect(ack).toHaveBeenCalledWith({ error: "INVALID_PAYLOAD" });
    });

    it("no-ops when presence room does not exist", async () => {
      hasPresenceRoom.mockResolvedValue(false);
      const ack = vi.fn();

      await handleJoinSession(
        mockSocket(teacherUser()),
        { sessionId: TEST_ROOM_ID },
        ack
      );

      expect(liveSessionFindFirst).not.toHaveBeenCalled();
      expect(joinPresence).not.toHaveBeenCalled();
      expect(ack).toHaveBeenCalledWith({ error: "SESSION_NOT_FOUND" });
    });

    it("self-heals and emits socket_error when session is not live in Postgres", async () => {
      liveSessionFindFirst.mockResolvedValue(null);
      const socket = mockSocket(teacherUser());
      const ack = vi.fn();

      await handleJoinSession(socket, { sessionId: TEST_ROOM_ID }, ack);

      expect(clearPresenceRoom).toHaveBeenCalledWith(TEST_ROOM_ID);
      expect(clearParticipantControls).toHaveBeenCalledWith(TEST_ROOM_ID);
      expect(emitSocketError).toHaveBeenCalledWith(socket, {
        request: clientEvents.joinSession,
        code: "SESSION_NOT_LIVE",
        message: "The class has already ended."
      });
      expect(joinPresence).not.toHaveBeenCalled();
      expect(ack).toHaveBeenCalledWith({ error: "SESSION_NOT_LIVE" });
    });

    it("joins presence, ensures controls, broadcasts, and acks snapshot", async () => {
      const user = teacherUser();
      const socket = mockSocket(user);
      const ack = vi.fn();

      await handleJoinSession(socket, { sessionId: TEST_ROOM_ID }, ack);

      expect(liveSessionFindFirst).toHaveBeenCalledWith({
        where: { roomId: TEST_ROOM_ID, status: "live" },
        select: { id: true }
      });
      expect(joinPresence).toHaveBeenCalledWith(socket, user, TEST_ROOM_ID);
      expect(ensureParticipantControlsForUser).toHaveBeenCalledWith(
        TEST_ROOM_ID,
        user,
        undefined
      );
      expect(broadcastParticipantControls).toHaveBeenCalledWith(TEST_ROOM_ID);
      expect(getJoinControlsSnapshot).toHaveBeenCalledWith(TEST_ROOM_ID);
      expect(ack).toHaveBeenCalledWith({
        roomId: TEST_ROOM_ID,
        participantControls: {}
      });
    });

    it("passes student microphoneEnabled preference into ensure", async () => {
      const user = studentUser();
      const socket = mockSocket(user);
      const ack = vi.fn();

      await handleJoinSession(
        socket,
        { sessionId: TEST_ROOM_ID, microphoneEnabled: true },
        ack
      );

      expect(ensureParticipantControlsForUser).toHaveBeenCalledWith(
        TEST_ROOM_ID,
        user,
        { microphoneEnabled: true }
      );
      expect(ack).toHaveBeenCalledWith({
        roomId: TEST_ROOM_ID,
        participantControls: {}
      });
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
      expect(clearParticipantControls).toHaveBeenCalledWith(TEST_ROOM_ID);
      expect(emitToRoom).toHaveBeenCalledWith(
        TEST_ROOM_ID,
        serverEvents.sessionEnded,
        { sessionId: TEST_ROOM_ID }
      );
      expect(disconnectRoom).toHaveBeenCalledWith(TEST_ROOM_ID);
    });
  });
});
