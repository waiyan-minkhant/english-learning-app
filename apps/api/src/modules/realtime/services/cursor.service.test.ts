import { serverEvents } from "@english-learning/contracts/socket/events";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockSocket, studentUser, TEST_ROOM_ID } from "../../../test/helpers.js";

const { getConnection, isSessionLive, canUseCursor } = vi.hoisted(() => ({
  getConnection: vi.fn(),
  isSessionLive: vi.fn(),
  canUseCursor: vi.fn()
}));

vi.mock("./connection.service.js", () => ({
  getConnection,
  unbindSocket: vi.fn()
}));

vi.mock("../../session/services/session.service.js", () => ({
  isSessionLive
}));

vi.mock("../../session/services/participant-controls.service.js", () => ({
  canUseCursor
}));

vi.mock("../realtime.gateway.js", () => ({
  emitSocketError: vi.fn()
}));

import { handleMoveCursor } from "./cursor.service.js";

describe("cursor.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getConnection.mockResolvedValue({
      roomId: TEST_ROOM_ID,
      userId: studentUser().id
    });
    isSessionLive.mockResolvedValue(true);
    canUseCursor.mockResolvedValue(true);
  });

  it("does not broadcast when cursor permission is denied", async () => {
    canUseCursor.mockResolvedValue(false);
    const socket = mockSocket(studentUser(), "socket-1");
    const emit = vi.fn();
    socket.to = vi.fn().mockReturnValue({ emit });

    await handleMoveCursor(socket, {
      sessionId: TEST_ROOM_ID,
      x: 0.5,
      y: 0.5
    });

    expect(canUseCursor).toHaveBeenCalledWith(TEST_ROOM_ID, studentUser());
    expect(socket.to).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
  });

  it("broadcasts cursor_moved when permission is granted", async () => {
    const socket = mockSocket(studentUser(), "socket-1");
    const emit = vi.fn();
    socket.to = vi.fn().mockReturnValue({ emit });

    await handleMoveCursor(socket, {
      sessionId: TEST_ROOM_ID,
      x: 0.5,
      y: 0.5
    });

    expect(socket.to).toHaveBeenCalledWith(TEST_ROOM_ID);
    expect(emit).toHaveBeenCalledWith(serverEvents.cursorMoved, {
      sessionId: TEST_ROOM_ID,
      userId: studentUser().id,
      x: 0.5,
      y: 0.5
    });
  });
});
