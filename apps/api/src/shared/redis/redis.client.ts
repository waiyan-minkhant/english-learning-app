import { createClient, type RedisClientType } from "redis";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

let client: RedisClientType | null = null;

export async function connectRedis() {
  if (client?.isOpen) {
    return client;
  }

  const redis = createClient({ url: redisUrl });
  redis.on("error", (err) => {
    console.error("[redis] client error", err);
  });

  await redis.connect();
  client = redis as RedisClientType;
  console.log("[redis] connected", { url: redisUrl });
  return client;
}

export function getRedis(): RedisClientType {
  if (!client?.isOpen) {
    throw new Error("Redis client is not connected");
  }
  return client;
}

/** Pub + sub clients for @socket.io/redis-adapter (duplicate connection). */
export async function createRedisPubSubClients() {
  const pubClient = createClient({ url: redisUrl });
  const subClient = pubClient.duplicate();

  pubClient.on("error", (err) => console.error("[redis] pub error", err));
  subClient.on("error", (err) => console.error("[redis] sub error", err));

  await Promise.all([pubClient.connect(), subClient.connect()]);

  return { pubClient, subClient };
}
