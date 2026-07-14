import { serverEvents } from "@english-learning/contracts/socket/events";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  mockSocket,
  studentUser,
  teacherUser,
  TEST_ROOM_ID
} from "../../../test/helpers.js";
import { InMemoryParticipantControlsStore } from "../state/participant-controls.in-memory-store.js";

const controlsTestStore = new InMemoryParticipantControlsStore();

const { hasPresenceRoom, emitToRoom, liveSessionFindFirst } = vi.hoisted(() => ({
  hasPresenceRoom: vi.fn(),
  emitToRoom: vi.fn(),
  liveSessionFindFirst: vi.fn()
}));

vi.mock("../../../lib/prisma.js", () => ({
  prisma: {
    liveSession: {
      findFirst: liveSessionFindFirst
    }
  }
}));

vi.mock("../../realtime/services/presence.service.js", () => ({
  hasPresenceRoom
}));

vi.mock("../../realtime/realtime.gateway.js", () => ({
  emitToRoom
}));

vi.mock("../state/participant-controls.state.js", () => ({
  TEACHER_PARTICIPANT_CONTROLS: {
    microphoneEnabled: true,
    cursorEnabled: true
  },
  STUDENT_PARTICIPANT_CONTROLS: {
    microphoneEnabled: true,
    cursorEnabled: false
  },
  initializeParticipantControls: (
    sessionId: string,
    entries: Record<string, { microphoneEnabled: boolean; cursorEnabled: boolean }>
  ) => controlsTestStore.initializeParticipantControls(sessionId, entries),
  getParticipantControls: (
    sessionId: string,
    userId: string
  ) => controlsTestStore.getParticipantControls(sessionId, userId),
  getAllParticipantControls: (sessionId: string) =>
    controlsTestStore.getAllParticipantControls(sessionId),
  setParticipantControls: (
    sessionId: string,
    userId: string,
    controls: { microphoneEnabled: boolean; cursorEnabled: boolean }
  ) => controlsTestStore.setParticipantControls(sessionId, userId, controls),
  updateParticipantControls: (
    sessionId: string,
    userId: string,
    patch: Partial<{ microphoneEnabled: boolean; cursorEnabled: boolean }>
  ) => controlsTestStore.updateParticipantControls(sessionId, userId, patch),
  updateBulkStudentControls: (
    sessionId: string,
    teacherUserId: string,
    patch: Partial<{ microphoneEnabled: boolean; cursorEnabled: boolean }>
  ) =>
    controlsTestStore.updateBulkStudentControls(
      sessionId,
      teacherUserId,
      patch
    ),
  ensureParticipantControls: (
    sessionId: string,
    userId: string,
    role: "teacher" | "student"
  ) => controlsTestStore.ensureParticipantControls(sessionId, userId, role),
  clearParticipantControls: (sessionId: string) =>
    controlsTestStore.clearParticipantControls(sessionId)
}));

import {
  canUseCursor,
  getJoinControlsSnapshot,
  initializeSessionParticipantControls,
  updateBulkParticipantControls,
  updateParticipantControls
} from "./participant-controls.service.js";

const BOB_ID = "33333333-3333-4333-8333-333333333333";

describe("participant-controls.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    controlsTestStore.reset();
    hasPresenceRoom.mockResolvedValue(true);
    liveSessionFindFirst.mockResolvedValue({ id: "session-id" });
  });

  it("seeds teacher true/true and students mic true / cursor false on initialize", async () => {
    await initializeSessionParticipantControls(TEST_ROOM_ID, teacherUser().id, [
      studentUser().id,
      BOB_ID
    ]);

    const snapshot = await getJoinControlsSnapshot(TEST_ROOM_ID);

    expect(snapshot.participantControls[teacherUser().id]).toEqual({
      microphoneEnabled: true,
      cursorEnabled: true
    });
    expect(snapshot.participantControls[studentUser().id]).toEqual({
      microphoneEnabled: true,
      cursorEnabled: false
    });
    expect(snapshot.participantControls[BOB_ID]).toEqual({
      microphoneEnabled: true,
      cursorEnabled: false
    });
  });

  it("bulk mute all sets every student microphoneEnabled to false", async () => {
    await initializeSessionParticipantControls(TEST_ROOM_ID, teacherUser().id, [
      studentUser().id,
      BOB_ID
    ]);

    await controlsTestStore.setParticipantControls(TEST_ROOM_ID, BOB_ID, {
      microphoneEnabled: true,
      cursorEnabled: false
    });

    const socket = mockSocket(teacherUser());
    await updateBulkParticipantControls(socket, {
      sessionId: TEST_ROOM_ID,
      target: "all_students",
      microphoneEnabled: false
    });

    const snapshot = await getJoinControlsSnapshot(TEST_ROOM_ID);
    expect(snapshot.participantControls[studentUser().id]?.microphoneEnabled).toBe(
      false
    );
    expect(snapshot.participantControls[BOB_ID]?.microphoneEnabled).toBe(false);
    expect(snapshot.participantControls[teacherUser().id]?.microphoneEnabled).toBe(
      true
    );
  });

  it("single update mute only changes one student", async () => {
    await initializeSessionParticipantControls(TEST_ROOM_ID, teacherUser().id, [
      studentUser().id,
      BOB_ID
    ]);

    const socket = mockSocket(teacherUser());
    await updateParticipantControls(socket, {
      sessionId: TEST_ROOM_ID,
      userId: BOB_ID,
      microphoneEnabled: false
    });

    const snapshot = await getJoinControlsSnapshot(TEST_ROOM_ID);
    expect(snapshot.participantControls[BOB_ID]).toEqual({
      microphoneEnabled: false,
      cursorEnabled: false
    });
    expect(snapshot.participantControls[studentUser().id]?.microphoneEnabled).toBe(
      true
    );
  });

  it("broadcasts full map on update", async () => {
    await initializeSessionParticipantControls(TEST_ROOM_ID, teacherUser().id, [
      studentUser().id
    ]);

    const socket = mockSocket(teacherUser());
    await updateParticipantControls(socket, {
      sessionId: TEST_ROOM_ID,
      userId: studentUser().id,
      cursorEnabled: true
    });

    expect(emitToRoom).toHaveBeenCalledWith(
      TEST_ROOM_ID,
      serverEvents.participantControlsUpdated,
      {
        sessionId: TEST_ROOM_ID,
        participantControls: expect.objectContaining({
          [studentUser().id]: {
            microphoneEnabled: true,
            cursorEnabled: true
          }
        })
      }
    );
  });

  it("canUseCursor returns true for teachers regardless of stored controls", async () => {
    await initializeSessionParticipantControls(TEST_ROOM_ID, teacherUser().id, [
      studentUser().id
    ]);

    await controlsTestStore.setParticipantControls(
      TEST_ROOM_ID,
      teacherUser().id,
      {
        microphoneEnabled: false,
        cursorEnabled: false
      }
    );

    await expect(canUseCursor(TEST_ROOM_ID, teacherUser())).resolves.toBe(true);
  });

  it("canUseCursor reads student entry directly", async () => {
    await initializeSessionParticipantControls(TEST_ROOM_ID, teacherUser().id, [
      studentUser().id
    ]);

    await expect(canUseCursor(TEST_ROOM_ID, studentUser())).resolves.toBe(false);

    await controlsTestStore.setParticipantControls(
      TEST_ROOM_ID,
      studentUser().id,
      {
        microphoneEnabled: false,
        cursorEnabled: true
      }
    );

    await expect(canUseCursor(TEST_ROOM_ID, studentUser())).resolves.toBe(true);
  });
});
