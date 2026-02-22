import Redis from "ioredis";

const redisClientFactory = () => {
    const client = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
    });

    client.on("error", (error) => {
        console.error("Redis connection error:", error);
    });

    return client;
};

declare global {
    var redis: Redis | undefined;
}

export const redis = globalThis.redis ?? redisClientFactory();

if (process.env.NODE_ENV !== "production") {
    globalThis.redis = redis;
}
