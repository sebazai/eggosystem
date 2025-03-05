import { createClient } from "redis";

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST ?? "eggo-redis",
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379
  }
});

redisClient.on("connect", () => {
  console.log("Redis connected");
});

redisClient.on("error", (err) => {
  console.error("Redis connection error:", err);
});

(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error("Redis connection failed:", err);
  }
})();

export const closeRedis = async () => {
  if (redisClient.isOpen) {
    await redisClient.quit();
    console.log("🔌 Redis connection closed");
  }
};

export default redisClient;
