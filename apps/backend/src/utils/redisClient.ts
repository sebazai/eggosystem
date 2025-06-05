import Redis from "ioredis";

export const expireInOneDay = 24 * 60 * 60;
export const expireIn30Days = 30 * 24 * 60 * 60;
export const expireIn7Days = 7 * 24 * 60 * 60;
export const expireIn20m = 20 * 60;

export const redisClient = new Redis({
  host: process.env.REDIS_HOST ?? "eggo-redis",
  port: parseInt(process.env.REDIS_PORT ?? "6379", 10)
});

redisClient.on("error", (err: Error) => {
  console.error("Redis connection error", err);
});

export const closeRedis = async () => {
  await redisClient.quit();
};
