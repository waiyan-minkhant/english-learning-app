import type { AuthUser } from "@english-learning/contracts";
import type { PresenceStatus } from "@english-learning/contracts/socket/schema";
import { getRedis } from "../../../shared/redis/redis.client.js";

export type PresenceEntryRecord = {
  email: string;
  role: AuthUser["role"];
  status: PresenceStatus;
  socketIds: string[];
};

export type SocketContextRecord = {
  sessionId: string;
  userId: string;
};

const SOCKET_HASH_KEY = "presence:socket";

function roomMarkerKey(sessionId: string) {
  return `presence:room:${sessionId}`;
}

function sessionHashKey(sessionId: string) {
  return `presence:session:${sessionId}`;
}

function parseEntry(raw: string): PresenceEntryRecord | null {
  try {
    return JSON.parse(raw) as PresenceEntryRecord;
  } catch {
    return null;
  }
}

function parseContext(raw: string): SocketContextRecord | null {
  try {
    return JSON.parse(raw) as SocketContextRecord;
  } catch {
    return null;
  }
}

export async function markSessionRoom(sessionId: string) {
  await getRedis().set(roomMarkerKey(sessionId), "1");
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
    sessionHashKey(sessionId),
    userId,
    JSON.stringify(entry)
  );
}

export async function getPresenceEntry(
  sessionId: string,
  userId: string
): Promise<PresenceEntryRecord | null> {
  const raw = await getRedis().hGet(sessionHashKey(sessionId), userId);
  if (!raw) return null;
  return parseEntry(raw);
}

export async function getAllPresenceEntries(
  sessionId: string
): Promise<Map<string, PresenceEntryRecord>> {
  const raw = await getRedis().hGetAll(sessionHashKey(sessionId));
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
  await getRedis().hDel(sessionHashKey(sessionId), userId);
}

export async function deleteSessionPresenceHash(sessionId: string) {
  await getRedis().del(sessionHashKey(sessionId));
}

export async function setSocketContext(
  socketId: string,
  context: SocketContextRecord
) {
  await getRedis().hSet(SOCKET_HASH_KEY, socketId, JSON.stringify(context));
}

export async function getSocketContext(
  socketId: string
): Promise<SocketContextRecord | null> {
  const raw = await getRedis().hGet(SOCKET_HASH_KEY, socketId);
  if (!raw) return null;
  return parseContext(raw);
}

export async function deleteSocketContext(socketId: string) {
  await getRedis().hDel(SOCKET_HASH_KEY, socketId);
}

/** Remove session hash, room marker, and all socket contexts for users in that session. */
export async function clearSessionPresenceState(sessionId: string) {
  const entries = await getAllPresenceEntries(sessionId);
  const redis = getRedis();

  for (const entry of entries.values()) {
    for (const socketId of entry.socketIds) {
      await redis.hDel(SOCKET_HASH_KEY, socketId);
    }
  }

  await redis.del(sessionHashKey(sessionId));
  await redis.del(roomMarkerKey(sessionId));
}
