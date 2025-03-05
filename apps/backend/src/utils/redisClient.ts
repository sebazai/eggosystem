import { createClient } from "redis";

console.log("REDIS_HOST", process.env.REDIS_HOST);
console.log("REDIS_PORT", process.env.REDIS_PORT);
const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST ?? "eggo-redis",
    port: parseInt(process.env.REDIS_PORT ?? "6379", 10)
  }
});

redisClient.on("error", (err: Error) => {
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
    // redis.quit() creates a thread to close the connection.
    // We wait until all threads have been run once to ensure the connection closes.
    await new Promise((resolve) => setImmediate(resolve));
  }
};

export default redisClient;
