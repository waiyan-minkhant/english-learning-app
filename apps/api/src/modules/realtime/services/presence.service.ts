import type { AuthUser } from "@english-learning/contracts";
import { serverEvents } from "@english-learning/contracts/socket/events";
import type { Presence } from "@english-learning/contracts/socket/schema";
import type { Socket } from "socket.io";
import * as connectionService from "./connection.service.js";
import { emitToRoom } from "../realtime.gateway.js";
import * as presenceState from "../state/presence.state.js";

const DISCONNECT_TIMEOUT_MS =
  Number(process.env.REALTIME_DISCONNECT_TIMEOUT_MS) || 30_000;

const TEACHER_AUTO_END_MS =
  Number(process.env.TEACHER_AUTO_END_SESSION_MS) || 5_000;

/** Process-local reconnect timers (not stored in Redis). */
const disconnectTimers = new Map<string, NodeJS.Timeout>();

/** Process-local timers to auto-end class after teacher disconnect. */
const autoEndTimers = new Map<string, NodeJS.Timeout>();

function timerKey(sessionId: string, userId: string) {
  return `${sessionId}:${userId}`;
}

function clearDisconnectTimer(sessionId: string, userId: string) {
  const key = timerKey(sessionId, userId);
  const timer = disconnectTimers.get(key);
  if (timer) {
    clearTimeout(timer);
    disconnectTimers.delete(key);
  }
}

function clearAutoEndTimer(sessionId: string) {
  const timer = autoEndTimers.get(sessionId);
  if (timer) {
    clearTimeout(timer);
    autoEndTimers.delete(sessionId);
  }
}

function scheduleTeacherAutoEnd(sessionId: string, teacherId: string) {
  clearAutoEndTimer(sessionId);

  const timer = setTimeout(async () => {
    autoEndTimers.delete(sessionId);
    const { autoEndSession } = await import(
      "../../session/services/session.service.js"
    );
    await autoEndSession(sessionId, teacherId);
  }, TEACHER_AUTO_END_MS);

  autoEndTimers.set(sessionId, timer);
}

async function getSessionPresenceList(sessionId: string): Promise<Presence[]> {
  const entries = await presenceState.getAllPresenceEntries(sessionId);
  const participants: Presence[] = [];

  for (const [userId, entry] of entries) {
    if (entry.status === "online" || entry.status === "reconnecting" || entry.status === "offline") {
      participants.push({
        userId,
        email: entry.email,
        role: entry.role,
        status: entry.status
      });
    }
  }

  return participants;
}

async function emitPresenceUpdated(sessionId: string) {
  const payload = {
    sessionId,
    participants: await getSessionPresenceList(sessionId)
  };
  console.log("[presence] emitted presence_updated", { payload });
  emitToRoom(sessionId, serverEvents.presenceUpdated, payload);
}

function emitParticipantLeft(sessionId: string, userId: string) {
  emitToRoom(sessionId, serverEvents.participantLeft, { sessionId, userId });
}

function emitParticipantDisconnected(sessionId: string, userId: string) {
  emitToRoom(sessionId, serverEvents.participantDisconnected, {
    sessionId,
    userId
  });
}

function emitTeacherOffline(sessionId: string, userId: string) {
  emitToRoom(sessionId, serverEvents.teacherOffline, { sessionId, userId });
}

function scheduleDisconnectTimer(sessionId: string, userId: string) {
  clearDisconnectTimer(sessionId, userId);

  const key = timerKey(sessionId, userId);
  const timer = setTimeout(async () => {
    disconnectTimers.delete(key);

    const current = await presenceState.getPresenceEntry(sessionId, userId);
    if (!current || current.socketIds.length > 0) return;
    if (current.status !== "reconnecting") return;

    if (current.role === "teacher") {
      emitTeacherOffline(sessionId, userId);
    }

    current.status = "offline";
    await presenceState.setPresenceEntry(sessionId, userId, current);

    emitParticipantDisconnected(sessionId, userId);
    await emitPresenceUpdated(sessionId);

    if (current.role === "teacher") {
      scheduleTeacherAutoEnd(sessionId, userId);
    }
  }, DISCONNECT_TIMEOUT_MS);

  disconnectTimers.set(key, timer);
}

export async function initializePresenceRoom(sessionId: string) {
  await presenceState.markSessionRoom(sessionId);
}

export async function hasPresenceRoom(sessionId: string) {
  return presenceState.sessionRoomExists(sessionId);
}

export async function registerParticipants(
  sessionId: string,
  users: Pick<AuthUser, "id" | "email" | "role">[]
) {
  if (!(await presenceState.sessionRoomExists(sessionId))) return;

  for (const user of users) {
    const existing = await presenceState.getPresenceEntry(sessionId, user.id);
    if (!existing) {
      await presenceState.setPresenceEntry(sessionId, user.id, {
        email: user.email,
        role: user.role,
        status: "offline",
        socketIds: []
      });
    }
  }
}

export async function clearPresenceRoom(sessionId: string) {
  const entries = await presenceState.getAllPresenceEntries(sessionId);

  for (const [userId] of entries) {
    clearDisconnectTimer(sessionId, userId);
  }

  clearAutoEndTimer(sessionId);

  await connectionService.clearConnectionsForRoom(sessionId);
  await presenceState.clearSessionPresenceState(sessionId);
}

export async function joinPresence(
  socket: Socket,
  user: AuthUser,
  sessionId: string
) {
  await registerParticipants(sessionId, [user]);

  let entry = await presenceState.getPresenceEntry(sessionId, user.id);

  if (!entry) {
    entry = {
      email: user.email,
      role: user.role,
      status: "online",
      socketIds: []
    };
  }

  clearDisconnectTimer(sessionId, user.id);
  if (user.role === "teacher") {
    clearAutoEndTimer(sessionId);
  }
  entry.email = user.email;
  entry.role = user.role;
  entry.status = "online";
  if (!entry.socketIds.includes(socket.id)) {
    entry.socketIds.push(socket.id);
  }

  await presenceState.setPresenceEntry(sessionId, user.id, entry);
  await connectionService.bindSocket(socket.id, sessionId, user.id);
  socket.join(sessionId);

  await emitPresenceUpdated(sessionId);
}

export async function leavePresence(
  socket: Socket,
  user: AuthUser,
  sessionId: string
) {
  const entry = await presenceState.getPresenceEntry(sessionId, user.id);
  if (!entry) return;

  clearDisconnectTimer(sessionId, user.id);

  for (const socketId of entry.socketIds) {
    await connectionService.unbindSocket(socketId);
  }
  await presenceState.deletePresenceEntry(sessionId, user.id);
  await connectionService.unbindSocket(socket.id);
  socket.leave(sessionId);

  const remaining = await presenceState.getAllPresenceEntries(sessionId);
  if (remaining.size === 0) {
    await presenceState.removeSessionRoomMarker(sessionId);
    await presenceState.deleteSessionPresenceHash(sessionId);
  }

  emitParticipantLeft(sessionId, user.id);
  await emitPresenceUpdated(sessionId);
}

export async function handleSocketDisconnect(socket: Socket) {
  const connection = await connectionService.getConnection(socket.id);
  if (!connection) return;

  const { roomId: sessionId, userId } = connection;
  await connectionService.unbindSocket(socket.id);

  const entry = await presenceState.getPresenceEntry(sessionId, userId);
  if (!entry) return;

  entry.socketIds = entry.socketIds.filter((id) => id !== socket.id);
  socket.leave(sessionId);

  console.log("[presence] handleSocketDisconnect", {
    sessionId,
    userId,
    remainingSockets: entry.socketIds.length
  });

  if (entry.socketIds.length > 0) {
    await presenceState.setPresenceEntry(sessionId, userId, entry);
    await emitPresenceUpdated(sessionId);
    return;
  }

  entry.status = "reconnecting";
  await presenceState.setPresenceEntry(sessionId, userId, entry);
  scheduleDisconnectTimer(sessionId, userId);
  await emitPresenceUpdated(sessionId);
}
