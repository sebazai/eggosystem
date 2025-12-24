import { logger } from "./app-logger";
import { redisClient } from "./redisClient";

export const setRateLimitForService = async (
  service: string,
  retryAfter: string | null,
  rateLimitReset: string | null
) => {
  const secondsUntilRateLimitReset = rateLimitReset
    ? Number(rateLimitReset) - Date.now() / 1000
    : null;

  if (retryAfter) {
    await redisClient.set(
      `${service}-rate-limit-error`,
      JSON.stringify({
        retryAfter,
        rateLimitReset
      }),
      "EX",
      retryAfter
        ? Number(retryAfter)
        : secondsUntilRateLimitReset
          ? secondsUntilRateLimitReset
          : 3600
    );
  }

  logger.error(
    `[${service}] Rate limit exceeded (429). ` +
      `Retry-After: ${retryAfter || "not provided"}, ` +
      `RateLimit-Reset: ${rateLimitReset || "not provided"}. `
  );
};

export const getRateLimitForService = async (service: string) => {
  const rateLimit = await redisClient.get(`${service}-rate-limit-error`);
  return rateLimit ? JSON.parse(rateLimit) : null;
};
