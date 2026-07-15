import type { AuthUser } from "@english-learning/contracts";
import { serverEvents } from "@english-learning/contracts/socket/events";
import type {
  JoinSessionSuccessPayload
} from "@english-learning/contracts/socket/schema";
import {
  updateBulkParticipantControlsPayloadSchema,
  updateParticipantControlsPayloadSchema
} from "@english-learning/contracts/socket/schema";
import type { Socket } from "socket.io";
import { prisma } from "../../../lib/prisma.js";
import { hasPresenceRoom } from "../../realtime/services/presence.service.js";
import { emitToRoom } from "../../realtime/realtime.gateway.js";
import * as participantControlsState from "../state/participant-controls.state.js";

function getSocketUser(socket: Socket): AuthUser | null {
  const user = (socket.data as { user?: AuthUser }).user;
  return user ?? null;
}

async function isSessionLive(roomId: string): Promise<boolean> {
  const session = await prisma.liveSession.findFirst({
    where: { roomId, status: "live" },
    select: { id: true }
  });
  return session !== null;
}

export async function broadcastParticipantControls(sessionId: string) {
  const participantControls =
    await participantControlsState.getAllParticipantControls(sessionId);

  emitToRoom(sessionId, serverEvents.participantControlsUpdated, {
    sessionId,
    participantControls
  });
}

export async function getJoinControlsSnapshot(
  sessionId: string
): Promise<Pick<JoinSessionSuccessPayload, "participantControls">> {
  const participantControls =
    await participantControlsState.getAllParticipantControls(sessionId);
  return { participantControls };
}

export async function canUseCursor(sessionId: string, user: AuthUser) {
  if (user.role === "teacher") return true;

  const controls = await participantControlsState.getParticipantControls(
    sessionId,
    user.id
  );
  return controls?.cursorEnabled ?? false;
}

export async function canUseMicrophone(sessionId: string, user: AuthUser) {
  if (user.role === "teacher") return true;

  const controls = await participantControlsState.getParticipantControls(
    sessionId,
    user.id
  );
  return controls?.microphoneEnabled ?? false;
}

export async function ensureParticipantControlsForUser(
  sessionId: string,
  user: AuthUser,
  initial?: { microphoneEnabled?: boolean }
) {
  await participantControlsState.ensureParticipantControls(
    sessionId,
    user.id,
    user.role,
    user.role === "student" && initial?.microphoneEnabled !== undefined
      ? { microphoneEnabled: initial.microphoneEnabled }
      : undefined
  );
}

export async function updateParticipantControls(
  socket: Socket,
  payload: unknown
) {
  const user = getSocketUser(socket);
  if (!user || user.role !== "teacher") return;

  const parsed = updateParticipantControlsPayloadSchema.safeParse(payload);
  if (!parsed.success) return;

  const { sessionId, userId, ...patch } = parsed.data;
  if (!(await hasPresenceRoom(sessionId))) return;
  if (!(await isSessionLive(sessionId))) return;

  await participantControlsState.updateParticipantControls(
    sessionId,
    userId,
    patch
  );
  await broadcastParticipantControls(sessionId);
}

export async function updateBulkParticipantControls(
  socket: Socket,
  payload: unknown
) {
  const user = getSocketUser(socket);
  if (!user || user.role !== "teacher") return;

  const parsed = updateBulkParticipantControlsPayloadSchema.safeParse(payload);
  if (!parsed.success) return;

  const { sessionId, ...patch } = parsed.data;
  if (!(await hasPresenceRoom(sessionId))) return;
  if (!(await isSessionLive(sessionId))) return;

  const { target: _target, ...controlPatch } = patch;
  await participantControlsState.updateBulkStudentControls(
    sessionId,
    user.id,
    controlPatch
  );
  await broadcastParticipantControls(sessionId);
}

export {
  clearParticipantControls
} from "../state/participant-controls.state.js";
