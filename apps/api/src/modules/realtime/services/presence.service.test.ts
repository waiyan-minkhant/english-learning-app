import { serverEvents } from "@english-learning/contracts/socket/events";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";
import {
  mockSocket,
  studentUser,
  teacherUser,
  TEST_ROOM_ID
} from "../../../test/helpers.js";
import { InMemoryPresenceStore } from "./presence.in-memory-store.js";
import { InMemoryConnectionStore } from "./connection.in-memory-store.js";

const presenceTestStore = new InMemoryPresenceStore();
const connectionTestStore = new InMemoryConnectionStore();

const autoEndSession = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

const { emitToRoom } = vi.hoisted(() => ({
  emitToRoom: vi.fn()
}));

vi.mock("../../session/services/session.service.js", () => ({
  autoEndSession
}));

vi.mock("../realtime.gateway.js", () => ({
  emitToRoom
}));

vi.mock("../state/presence.state.js", () => ({
  markSessionRoom: (sessionId: string) =>
    presenceTestStore.markSessionRoom(sessionId),
  sessionRoomExists: (sessionId: string) =>
    presenceTestStore.sessionRoomExists(sessionId),
  removeSessionRoomMarker: (sessionId: string) =>
    presenceTestStore.removeSessionRoomMarker(sessionId),
  setPresenceEntry: (
    sessionId: string,
    userId: string,
    entry: Parameters<InMemoryPresenceStore["setPresenceEntry"]>[2]
  ) => presenceTestStore.setPresenceEntry(sessionId, userId, entry),
  getPresenceEntry: (sessionId: string, userId: string) =>
    presenceTestStore.getPresenceEntry(sessionId, userId),
  getAllPresenceEntries: (sessionId: string) =>
    presenceTestStore.getAllPresenceEntries(sessionId),
  deletePresenceEntry: (sessionId: string, userId: string) =>
    presenceTestStore.deletePresenceEntry(sessionId, userId),
  deleteSessionPresenceHash: (sessionId: string) =>
    presenceTestStore.deleteSessionPresenceHash(sessionId),
  clearSessionPresenceState: (sessionId: string) =>
    presenceTestStore.clearSessionPresenceState(sessionId)
}));

vi.mock("../state/connection.state.js", () => ({
  bindConnection: (
    socketId: string,
    record: Parameters<InMemoryConnectionStore["bindConnection"]>[1]
  ) => connectionTestStore.bindConnection(socketId, record),
  getConnection: (socketId: string) =>
    connectionTestStore.getConnection(socketId),
  unbindConnection: (socketId: string) =>
    connectionTestStore.unbindConnection(socketId),
  clearConnectionsForRoom: (roomId: string) =>
    connectionTestStore.clearConnectionsForRoom(roomId)
}));

import {
  clearPresenceRoom,
  handleSocketDisconnect,
  hasPresenceRoom,
  initializePresenceRoom,
  joinPresence,
  leavePresence,
  registerParticipants
} from "./presence.service.js";

function lastPresencePayload() {
  const calls = emitToRoom.mock.calls.filter(
    ([, event]) => event === serverEvents.presenceUpdated
  );
  return calls.at(-1)?.[2] as {
    sessionId: string;
    participants: { userId: string; status: string }[];
  };
}

describe("presence.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    presenceTestStore.reset();
    connectionTestStore.reset();
  });

  describe("room lifecycle", () => {
    it("initializePresenceRoom marks room as existing", async () => {
      await initializePresenceRoom(TEST_ROOM_ID);
      expect(await hasPresenceRoom(TEST_ROOM_ID)).toBe(true);
    });
  });

  describe("joinPresence", () => {
    it("joins socket room and emits online participant", async () => {
      await initializePresenceRoom(TEST_ROOM_ID);
      const user = teacherUser();
      const socket = mockSocket(user, "socket-a");

      await joinPresence(socket, user, TEST_ROOM_ID);

      expect(socket.join).toHaveBeenCalledWith(TEST_ROOM_ID);
      const entry = await presenceTestStore.getPresenceEntry(
        TEST_ROOM_ID,
        user.id
      );
      expect(entry?.status).toBe("online");
      expect(entry?.socketIds).toContain("socket-a");

      const payload = lastPresencePayload();
      expect(payload.participants).toEqual([
        expect.objectContaining({ userId: user.id, status: "online" })
      ]);
    });

    it("includes offline seeded participants in presence_updated", async () => {
      await initializePresenceRoom(TEST_ROOM_ID);
      await registerParticipants(TEST_ROOM_ID, [studentUser()]);

      emitToRoom.mockClear();
      await joinPresence(
        mockSocket(teacherUser(), "socket-t"),
        teacherUser(),
        TEST_ROOM_ID
      );

      const payload = lastPresencePayload();
      expect(payload.participants).toHaveLength(2);
      expect(payload.participants).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            userId: teacherUser().id,
            status: "online"
          }),
          expect.objectContaining({
            userId: studentUser().id,
            status: "offline"
          })
        ])
      );
    });
  });

  describe("leavePresence", () => {
    it("removes participant and clears empty room", async () => {
      await initializePresenceRoom(TEST_ROOM_ID);
      const user = teacherUser();
      const socket = mockSocket(user);

      await joinPresence(socket, user, TEST_ROOM_ID);
      emitToRoom.mockClear();

      await leavePresence(socket, user, TEST_ROOM_ID);

      expect(socket.leave).toHaveBeenCalledWith(TEST_ROOM_ID);
      expect(
        await presenceTestStore.getPresenceEntry(TEST_ROOM_ID, user.id)
      ).toBeNull();
      expect(await hasPresenceRoom(TEST_ROOM_ID)).toBe(false);
      expect(emitToRoom).toHaveBeenCalledWith(
        TEST_ROOM_ID,
        serverEvents.participantLeft,
        { sessionId: TEST_ROOM_ID, userId: user.id }
      );
    });
  });

  describe("registerParticipants", () => {
    it("no-ops when room does not exist", async () => {
      await registerParticipants(TEST_ROOM_ID, [studentUser()]);
      expect(
        await presenceTestStore.getPresenceEntry(TEST_ROOM_ID, studentUser().id)
      ).toBeNull();
    });

    it("seeds offline entry when room exists", async () => {
      await initializePresenceRoom(TEST_ROOM_ID);
      await registerParticipants(TEST_ROOM_ID, [studentUser()]);

      const entry = await presenceTestStore.getPresenceEntry(
        TEST_ROOM_ID,
        studentUser().id
      );
      expect(entry?.status).toBe("offline");
      expect(entry?.socketIds).toEqual([]);
    });
  });

  describe("clearPresenceRoom", () => {
    it("clears state and cancels pending disconnect timer", async () => {
      vi.useFakeTimers();
      try {
        await initializePresenceRoom(TEST_ROOM_ID);
        const user = teacherUser();
        const socket = mockSocket(user, "socket-only");

        await joinPresence(socket, user, TEST_ROOM_ID);
        await handleSocketDisconnect(socket);

        emitToRoom.mockClear();
        await clearPresenceRoom(TEST_ROOM_ID);

        await vi.advanceTimersByTimeAsync(200);

        const disconnectCalls = emitToRoom.mock.calls.filter(
          ([, event]) => event === serverEvents.participantDisconnected
        );
        expect(disconnectCalls).toHaveLength(0);
        expect(await hasPresenceRoom(TEST_ROOM_ID)).toBe(false);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe("handleSocketDisconnect", () => {
    it("keeps user online when another tab remains connected", async () => {
      await initializePresenceRoom(TEST_ROOM_ID);
      const user = teacherUser();

      await joinPresence(mockSocket(user, "socket-a"), user, TEST_ROOM_ID);
      await joinPresence(mockSocket(user, "socket-b"), user, TEST_ROOM_ID);
      emitToRoom.mockClear();

      await handleSocketDisconnect(mockSocket(user, "socket-a"));

      const entry = await presenceTestStore.getPresenceEntry(
        TEST_ROOM_ID,
        user.id
      );
      expect(entry?.status).toBe("online");
      expect(entry?.socketIds).toEqual(["socket-b"]);

      const payload = lastPresencePayload();
      expect(payload.participants[0]?.status).toBe("online");
    });

    it("marks reconnecting when last socket disconnects", async () => {
      await initializePresenceRoom(TEST_ROOM_ID);
      const user = studentUser();
      const socket = mockSocket(user);

      await joinPresence(socket, user, TEST_ROOM_ID);
      emitToRoom.mockClear();

      await handleSocketDisconnect(socket);

      const entry = await presenceTestStore.getPresenceEntry(
        TEST_ROOM_ID,
        user.id
      );
      expect(entry?.status).toBe("reconnecting");
      expect(entry?.socketIds).toEqual([]);

      const payload = lastPresencePayload();
      expect(payload.participants[0]?.status).toBe("reconnecting");
    });
  });

  describe("disconnect / reconnect timer", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("marks teacher offline and emits teacher_offline after timeout", async () => {
      vi.useFakeTimers();
      await initializePresenceRoom(TEST_ROOM_ID);
      const user = teacherUser();
      const socket = mockSocket(user);

      await joinPresence(socket, user, TEST_ROOM_ID);
      await handleSocketDisconnect(socket);
      emitToRoom.mockClear();

      await vi.advanceTimersByTimeAsync(100);

      const entry = await presenceTestStore.getPresenceEntry(
        TEST_ROOM_ID,
        user.id
      );
      expect(entry?.status).toBe("offline");
      expect(entry?.socketIds).toEqual([]);
      expect(await hasPresenceRoom(TEST_ROOM_ID)).toBe(true);
      expect(emitToRoom).toHaveBeenCalledWith(
        TEST_ROOM_ID,
        serverEvents.teacherOffline,
        { sessionId: TEST_ROOM_ID, userId: user.id }
      );
      expect(emitToRoom).toHaveBeenCalledWith(
        TEST_ROOM_ID,
        serverEvents.participantDisconnected,
        { sessionId: TEST_ROOM_ID, userId: user.id }
      );
      expect(lastPresencePayload().participants).toEqual([
        expect.objectContaining({ userId: user.id, status: "offline" })
      ]);

      await vi.advanceTimersByTimeAsync(100);

      expect(autoEndSession).toHaveBeenCalledWith(TEST_ROOM_ID, user.id);
    });

    it("marks student offline without emitting teacher_offline after timeout", async () => {
      vi.useFakeTimers();
      await initializePresenceRoom(TEST_ROOM_ID);
      const user = studentUser();
      const socket = mockSocket(user);

      await joinPresence(socket, user, TEST_ROOM_ID);
      await handleSocketDisconnect(socket);
      emitToRoom.mockClear();

      await vi.advanceTimersByTimeAsync(100);

      const entry = await presenceTestStore.getPresenceEntry(
        TEST_ROOM_ID,
        user.id
      );
      expect(entry?.status).toBe("offline");

      const teacherOfflineCalls = emitToRoom.mock.calls.filter(
        ([, event]) => event === serverEvents.teacherOffline
      );
      expect(teacherOfflineCalls).toHaveLength(0);
      expect(emitToRoom).toHaveBeenCalledWith(
        TEST_ROOM_ID,
        serverEvents.participantDisconnected,
        { sessionId: TEST_ROOM_ID, userId: user.id }
      );
      expect(autoEndSession).not.toHaveBeenCalled();
    });

    it("cancels timer when user rejoins", async () => {
      vi.useFakeTimers();
      await initializePresenceRoom(TEST_ROOM_ID);
      const user = teacherUser();
      const socket = mockSocket(user, "socket-old");

      await joinPresence(socket, user, TEST_ROOM_ID);
      await handleSocketDisconnect(socket);
      emitToRoom.mockClear();

      await joinPresence(mockSocket(user, "socket-new"), user, TEST_ROOM_ID);
      await vi.advanceTimersByTimeAsync(100);

      const entry = await presenceTestStore.getPresenceEntry(
        TEST_ROOM_ID,
        user.id
      );
      expect(entry?.status).toBe("online");
      expect(entry?.socketIds).toContain("socket-new");

      const disconnectCalls = emitToRoom.mock.calls.filter(
        ([, event]) => event === serverEvents.participantDisconnected
      );
      expect(disconnectCalls).toHaveLength(0);
    });

    it("does not mark user offline if sockets reconnected before timer fires", async () => {
      vi.useFakeTimers();
      await initializePresenceRoom(TEST_ROOM_ID);
      const user = studentUser();

      await joinPresence(mockSocket(user, "socket-a"), user, TEST_ROOM_ID);
      await handleSocketDisconnect(mockSocket(user, "socket-a"));

      const entry = await presenceTestStore.getPresenceEntry(
        TEST_ROOM_ID,
        user.id
      );
      if (entry) {
        entry.socketIds.push("socket-b");
        entry.status = "online";
        await presenceTestStore.setPresenceEntry(TEST_ROOM_ID, user.id, entry);
      }

      emitToRoom.mockClear();
      await vi.advanceTimersByTimeAsync(100);

      expect(
        await presenceTestStore.getPresenceEntry(TEST_ROOM_ID, user.id)
      ).not.toBeNull();
      const disconnectCalls = emitToRoom.mock.calls.filter(
        ([, event]) => event === serverEvents.participantDisconnected
      );
      expect(disconnectCalls).toHaveLength(0);

      const teacherOfflineCalls = emitToRoom.mock.calls.filter(
        ([, event]) => event === serverEvents.teacherOffline
      );
      expect(teacherOfflineCalls).toHaveLength(0);
      expect(autoEndSession).not.toHaveBeenCalled();
    });

    it("cancels teacher auto-end when teacher rejoins before timer fires", async () => {
      vi.useFakeTimers();
      await initializePresenceRoom(TEST_ROOM_ID);
      const user = teacherUser();

      await joinPresence(mockSocket(user, "socket-old"), user, TEST_ROOM_ID);
      await handleSocketDisconnect(mockSocket(user, "socket-old"));
      emitToRoom.mockClear();
      autoEndSession.mockClear();

      await vi.advanceTimersByTimeAsync(100);
      await joinPresence(mockSocket(user, "socket-new"), user, TEST_ROOM_ID);
      await vi.advanceTimersByTimeAsync(100);

      expect(autoEndSession).not.toHaveBeenCalled();
    });
  });
});
