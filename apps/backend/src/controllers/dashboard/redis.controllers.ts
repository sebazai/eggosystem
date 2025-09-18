import type { Request, Response, NextFunction } from "express";
import { redisClient } from "../../utils/redisClient";
import { BadRequestError } from "../../utils/errors";
import type {
  RedisKey,
  RedisKeysResponse,
  RedisKeyDataResponse,
  RedisDeleteResponse
} from "@eggosystem/types";

/**
 * Get Redis keys with pattern filtering and pagination
 */
export const getRedisKeys = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const pattern = req.query.pattern as string;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;

  // Validate search pattern - require a non-empty pattern that's not just "*"
  if (!pattern || pattern.trim() === "" || pattern.trim() === "*") {
    return next(
      new BadRequestError(
        "Search pattern is required and cannot be empty or '*'"
      )
    );
  }

  if (page < 1) {
    return next(new BadRequestError("Page must be greater than 0"));
  }
  if (limit < 1 || limit > 1000) {
    return next(new BadRequestError("Limit must be between 1 and 1000"));
  }

  const allKeys = await redisClient.keys(pattern);
  const total = allKeys.length;
  const totalPages = Math.ceil(total / limit);

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedKeys = allKeys.slice(startIndex, endIndex);

  const response: RedisKeysResponse = {
    success: true,
    data: paginatedKeys,
    pagination: {
      page,
      limit,
      total,
      totalPages
    }
  };

  res.json(response);
};

/**
 * Get data for a specific Redis key
 */
export const getRedisKeyData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { key } = req.params;

  if (!key) {
    return next(new BadRequestError("Key parameter is required"));
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
};

/**
 * Delete a specific Redis key (admin only)
 */
export const deleteRedisKey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { key } = req.params;

  if (!key) {
    return next(new BadRequestError("Key parameter is required"));
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
};
