import type { ParticipantControls } from "@english-learning/contracts/socket/schema";
import { getRedis } from "../../../shared/redis/redis.client.js";
import { REDIS_REALTIME_TTL_SECONDS } from "../../../shared/redis/redis.ttl.js";

export const TEACHER_PARTICIPANT_CONTROLS: ParticipantControls = {
  microphoneEnabled: true,
  cursorEnabled: true
};

export const STUDENT_PARTICIPANT_CONTROLS: ParticipantControls = {
  microphoneEnabled: true,
  cursorEnabled: false
};

function participantControlsKey(sessionId: string) {
  return `participant:controls:${sessionId}`;
}

function parseControls(raw: string): ParticipantControls | null {
  try {
    return JSON.parse(raw) as ParticipantControls;
  } catch {
    return null;
  }
}

async function refreshControlsTtl(sessionId: string) {
  await getRedis().expire(
    participantControlsKey(sessionId),
    REDIS_REALTIME_TTL_SECONDS
  );
}

export async function initializeParticipantControls(
  sessionId: string,
  entries: Record<string, ParticipantControls>
) {
  const redis = getRedis();
  const key = participantControlsKey(sessionId);

  await redis.del(key);

  for (const [userId, controls] of Object.entries(entries)) {
    await redis.hSet(key, userId, JSON.stringify(controls));
  }

  await refreshControlsTtl(sessionId);
}

export async function getParticipantControls(
  sessionId: string,
  userId: string
): Promise<ParticipantControls | null> {
  const raw = await getRedis().hGet(participantControlsKey(sessionId), userId);
  if (!raw) return null;
  return parseControls(raw);
}

export async function getAllParticipantControls(
  sessionId: string
): Promise<Record<string, ParticipantControls>> {
  const raw = await getRedis().hGetAll(participantControlsKey(sessionId));
  const controls: Record<string, ParticipantControls> = {};

  for (const [userId, value] of Object.entries(raw)) {
    const parsed = parseControls(value);
    if (parsed) controls[userId] = parsed;
  }

  return controls;
}

export async function setParticipantControls(
  sessionId: string,
  userId: string,
  controls: ParticipantControls
) {
  await getRedis().hSet(
    participantControlsKey(sessionId),
    userId,
    JSON.stringify(controls)
  );
  await refreshControlsTtl(sessionId);
}

export async function updateParticipantControls(
  sessionId: string,
  userId: string,
  patch: Partial<ParticipantControls>
): Promise<ParticipantControls> {
  const current =
    (await getParticipantControls(sessionId, userId)) ??
    STUDENT_PARTICIPANT_CONTROLS;
  const next = { ...current, ...patch };
  await setParticipantControls(sessionId, userId, next);
  return next;
}

export async function updateBulkStudentControls(
  sessionId: string,
  teacherUserId: string,
  patch: Partial<ParticipantControls>
) {
  const all = await getAllParticipantControls(sessionId);

  for (const [userId, controls] of Object.entries(all)) {
    if (userId === teacherUserId) continue;
    await setParticipantControls(sessionId, userId, { ...controls, ...patch });
  }
}

export async function ensureParticipantControls(
  sessionId: string,
  userId: string,
  role: "teacher" | "student"
) {
  const existing = await getParticipantControls(sessionId, userId);
  if (existing) return existing;

  const defaults =
    role === "teacher"
      ? TEACHER_PARTICIPANT_CONTROLS
      : STUDENT_PARTICIPANT_CONTROLS;
  await setParticipantControls(sessionId, userId, defaults);
  return defaults;
}

export async function clearParticipantControls(sessionId: string) {
  await getRedis().del(participantControlsKey(sessionId));
}
