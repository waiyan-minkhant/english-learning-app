import { getRedis } from "../../../shared/redis/redis.client.js";
import { REDIS_REALTIME_TTL_SECONDS } from "../../../shared/redis/redis.ttl.js";

export type ConnectionRecord = {
  roomId: string;
  userId: string;
};

function connectionKey(socketId: string) {
  return `connection:socket:${socketId}`;
}

function parseConnection(raw: string): ConnectionRecord | null {
  try {
    return JSON.parse(raw) as ConnectionRecord;
  } catch {
    return null;
  }
}

export async function bindConnection(
  socketId: string,
  record: ConnectionRecord
) {
  await getRedis().set(connectionKey(socketId), JSON.stringify(record), {
    EX: REDIS_REALTIME_TTL_SECONDS
  });
}

export async function getConnection(
  socketId: string
): Promise<ConnectionRecord | null> {
  const raw = await getRedis().get(connectionKey(socketId));
  if (!raw) return null;
  return parseConnection(raw);
}

export async function unbindConnection(socketId: string) {
  await getRedis().del(connectionKey(socketId));
}

export async function clearConnectionsForRoom(roomId: string) {
  const redis = getRedis();

  for await (const key of redis.scanIterator({
    MATCH: "connection:socket:*",
    COUNT: 100
  })) {
    const redisKey = Array.isArray(key) ? key[0] : key;
    if (!redisKey) continue;

    const raw = await redis.get(redisKey);
    if (!raw) continue;

    const connection = parseConnection(raw);
    if (connection?.roomId === roomId) {
      await redis.del(redisKey);
    }
  }
}
