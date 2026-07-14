import type { AuthUser } from "@english-learning/contracts";
import type { PresenceStatus } from "@english-learning/contracts/socket/schema";
import { getRedis } from "../../../shared/redis/redis.client.js";
import { REDIS_REALTIME_TTL_SECONDS } from "../../../shared/redis/redis.ttl.js";

export type PresenceEntryRecord = {
  email: string;
  name: string;
  role: AuthUser["role"];
  status: PresenceStatus;
  socketIds: string[];
};

function roomMarkerKey(sessionId: string) {
  return `session:${sessionId}`;
}

function presenceHashKey(sessionId: string) {
  return `session:${sessionId}:presence`;
}

function parseEntry(raw: string): PresenceEntryRecord | null {
  try {
    return JSON.parse(raw) as PresenceEntryRecord;
  } catch {
    return null;
  }
}

async function refreshSessionTtl(sessionId: string) {
  const redis = getRedis();
  await redis.expire(roomMarkerKey(sessionId), REDIS_REALTIME_TTL_SECONDS);
  await redis.expire(presenceHashKey(sessionId), REDIS_REALTIME_TTL_SECONDS);
}

export async function markSessionRoom(sessionId: string) {
  await getRedis().set(roomMarkerKey(sessionId), "1", {
    EX: REDIS_REALTIME_TTL_SECONDS
  });
}

export async function sessionRoomExists(sessionId: string) {
  return (await getRedis().exists(roomMarkerKey(sessionId))) === 1;
}

export async function removeSessionRoomMarker(sessionId: string) {
  await getRedis().del(roomMarkerKey(sessionId));
}

export async function setPresenceEntry(
  sessionId: string,
  userId: string,
  entry: PresenceEntryRecord
) {
  await getRedis().hSet(
    presenceHashKey(sessionId),
    userId,
    JSON.stringify(entry)
  );
  await refreshSessionTtl(sessionId);
}

export async function getPresenceEntry(
  sessionId: string,
  userId: string
): Promise<PresenceEntryRecord | null> {
  const raw = await getRedis().hGet(presenceHashKey(sessionId), userId);
  if (!raw) return null;
  return parseEntry(raw);
}

export async function getAllPresenceEntries(
  sessionId: string
): Promise<Map<string, PresenceEntryRecord>> {
  const raw = await getRedis().hGetAll(presenceHashKey(sessionId));
  const entries = new Map<string, PresenceEntryRecord>();

  for (const [userId, value] of Object.entries(raw)) {
    const entry = parseEntry(value);
    if (entry) entries.set(userId, entry);
  }

  return entries;
}

export async function deletePresenceEntry(
  sessionId: string,
  userId: string
) {
  await getRedis().hDel(presenceHashKey(sessionId), userId);
}

export async function deleteSessionPresenceHash(sessionId: string) {
  await getRedis().del(presenceHashKey(sessionId));
}

export async function clearSessionPresenceState(sessionId: string) {
  const redis = getRedis();
  await redis.del(presenceHashKey(sessionId));
  await redis.del(roomMarkerKey(sessionId));
}
