import { randomUUID } from "node:crypto";
import type { AuthUser } from "@english-learning/contracts";
import { clientEvents, serverEvents } from "@english-learning/contracts/socket/events";
import {
  endSessionPayloadSchema,
  joinSessionPayloadSchema
} from "@english-learning/contracts/socket/schema";
import type { Socket } from "socket.io";
import { prisma } from "../../../lib/prisma.js";
import { ForbiddenError } from "../../../shared/errors/forbidden-error.js";
import { NotFoundError } from "../../../shared/errors/not-found-error.js";
import {
  clearPresenceRoom,
  hasPresenceRoom,
  initializePresenceRoom,
  joinPresence,
  leavePresence
} from "../../realtime/services/presence.service.js";
import {
  disconnectRoom,
  emitSocketError,
  emitToRoom
} from "../../realtime/realtime.gateway.js";
import {
  clearParticipantControls,
  ensureParticipantControlsForUser,
  getJoinControlsSnapshot,
  initializeSessionParticipantControls
} from "./participant-controls.service.js";

function createRoomId() {
  return `class-${randomUUID().slice(0, 8)}`;
}

function getSocketUser(socket: Socket): AuthUser | null {
  const user = (socket.data as { user?: AuthUser }).user;
  return user ?? null;
}

function toLiveSessionResponse(session: {
  id: string;
  roomId: string;
  status: string;
  startedAt: Date | null;
  endedAt: Date | null;
  classId: string;
}) {
  return {
    id: session.id,
    roomId: session.roomId,
    status: session.status,
    startedAt: session.startedAt?.toISOString() ?? null,
    endedAt: session.endedAt?.toISOString() ?? null,
    classId: session.classId
  };
}

async function terminateSession(sessionId: string) {
  await clearPresenceRoom(sessionId);
  await clearParticipantControls(sessionId);
  emitToRoom(sessionId, serverEvents.sessionEnded, { sessionId });
  disconnectRoom(sessionId);
}

export async function startSession(teacherId: string) {
  const classRecord = await prisma.class.findFirst({
    where: { teacherId },
    include: { students: true }
  });

  if (!classRecord) {
    throw new NotFoundError("No class assigned to this teacher");
  }

  await prisma.liveSession.updateMany({
    where: { classId: classRecord.id, status: "live" },
    data: { status: "ended", endedAt: new Date() }
  });

  const session = await prisma.liveSession.create({
    data: {
      classId: classRecord.id,
      roomId: createRoomId(),
      status: "live",
      startedAt: new Date()
    }
  });

  await initializePresenceRoom(session.roomId);
  await initializeSessionParticipantControls(
    session.roomId,
    classRecord.teacherId,
    classRecord.students.map((student) => student.studentId)
  );

  return { roomId: session.roomId };
}

export async function joinSession(studentId: string) {
  const classRecord = await prisma.class.findFirst({
    where: { students: { some: { studentId } } }
  });

  if (!classRecord) {
    throw new NotFoundError("No class assigned to this student");
  }

  const session = await prisma.liveSession.findFirst({
    where: { classId: classRecord.id, status: "live" },
    orderBy: { startedAt: "desc" }
  });

  if (!session) {
    throw new NotFoundError("No live session is available to join");
  }

  return toLiveSessionResponse(session);
}

export async function endSession(teacherId: string, roomId: string) {
  const session = await prisma.liveSession.findFirst({
    where: { roomId, status: "live" },
    include: { class: true }
  });

  if (!session || session.class.teacherId !== teacherId) {
    throw new ForbiddenError("Cannot end this session");
  }

  await prisma.liveSession.update({
    where: { id: session.id },
    data: { status: "ended", endedAt: new Date() }
  });
}

/** Ends a live session after teacher disconnect timeout (no socket auth). */
export async function autoEndSession(roomId: string, teacherId: string) {
  if (!(await hasPresenceRoom(roomId))) return;

  try {
    await endSession(teacherId, roomId);
  } catch {
    return;
  }

  await terminateSession(roomId);
}

export async function isSessionLive(roomId: string): Promise<boolean> {
  const session = await prisma.liveSession.findFirst({
    where: { roomId, status: "live" },
    select: { id: true }
  });
  return session !== null;
}

export async function handleJoinSession(
  socket: Socket,
  payload: unknown,
  ack?: (response: unknown) => void
) {
  const user = getSocketUser(socket);
  if (!user) {
    ack?.({ error: "UNAUTHORIZED" });
    return;
  }

  console.log("[session] handleJoinSession", { user });

  const parsed = joinSessionPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    ack?.({ error: "INVALID_PAYLOAD" });
    return;
  }

  const sessionId = parsed.data;
  if (!(await hasPresenceRoom(sessionId))) {
    ack?.({ error: "SESSION_NOT_FOUND" });
    return;
  }

  if (!(await isSessionLive(sessionId))) {
    await clearPresenceRoom(sessionId);
    await clearParticipantControls(sessionId);
    emitSocketError(socket, {
      request: clientEvents.joinSession,
      code: "SESSION_NOT_LIVE",
      message: "The class has already ended."
    });
    ack?.({ error: "SESSION_NOT_LIVE" });
    return;
  }

  await joinPresence(socket, user, sessionId);
  await ensureParticipantControlsForUser(sessionId, user);
  const { participantControls } = await getJoinControlsSnapshot(sessionId);

  ack?.({
    roomId: sessionId,
    participantControls
  });
}

export async function handleLeaveSession(socket: Socket, payload: unknown) {
  const user = getSocketUser(socket);
  if (!user) return;

  const parsed = joinSessionPayloadSchema.safeParse(payload);
  if (!parsed.success) return;

  await leavePresence(socket, user, parsed.data);
}

export async function handleEndSession(socket: Socket, payload: unknown) {
  const user = getSocketUser(socket);
  if (!user || user.role !== "teacher") return;

  const parsed = endSessionPayloadSchema.safeParse(payload);
  if (!parsed.success) return;

  const sessionId = parsed.data;
  if (!(await hasPresenceRoom(sessionId))) return;

  try {
    await endSession(user.id, sessionId);
  } catch {
    return;
  }

  await terminateSession(sessionId);
}
