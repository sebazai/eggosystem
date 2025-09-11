import type { Request, Response, NextFunction } from "express";
import { redisClient } from "../../utils/redisClient";
import type {
  RedisKey,
  RedisKeysResponse,
  RedisKeyDataResponse,
  RedisDeleteResponse
} from "@eggosystem/types";

/**
 * Get all Redis keys with optional pattern filtering
 */
export const getRedisKeys = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const pattern = (req.query.pattern as string) || "*";
    const keys = await redisClient.keys(pattern);

    const response: RedisKeysResponse = {
      success: true,
      data: keys
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Get data for a specific Redis key
 */
export const getRedisKeyData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { key } = req.params;

    if (!key) {
      return next(new Error("Key parameter is required"));
    }

    const [value, type, ttl] = await Promise.all([
      redisClient.get(key),
      redisClient.type(key),
      redisClient.ttl(key)
    ]);

    const redisKey: RedisKey = {
      key,
      type,
      value,
      ttl
    };

    const response: RedisKeyDataResponse = {
      success: true,
      data: redisKey
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a specific Redis key (admin only)
 */
export const deleteRedisKey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { key } = req.params;

    if (!key) {
      return next(new Error("Key parameter is required"));
    }

    const result = await redisClient.del(key);

    const response: RedisDeleteResponse = {
      success: true,
      message:
        result > 0
          ? "Key deleted successfully"
          : "Key not found or already deleted"
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};
