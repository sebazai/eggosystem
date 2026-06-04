import type { Request, Response, NextFunction } from "express";
import { createHash } from "crypto";
import { expireIn7Days, redisClient } from "../utils/redisClient";
import { getOrganizerActiveOrLatestSeasonForAppId } from "../models/season.models";
import { logger } from "../utils/app-logger";
import { normalizeParsedParams } from "../utils/normalize-parsed-params";

interface CacheResponseOptions {
  cachePrefix: string;
  requiredFields?: string[];
  ttlSeconds?: number;
}

export function cacheResponseMiddleware({
  cachePrefix,
  ttlSeconds = expireIn7Days
}: CacheResponseOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const searchParams = req.parsedParams;

    const allNull = Object.values(searchParams).every(
      (value) => value === null
    );
    if (allNull) {
      next();
      return;
    }

    if (searchParams.player_name) {
      next();
      return;
    }

    // If the current season is present in the filters, do not cache (its data
    // is still changing). TODO(#220): single organizer (1) / CS2 (730) today;
    // when the filters API becomes multi-org, resolve organizer_id/app_id from
    // the request instead of hardcoding.
    const activeSeason = await getOrganizerActiveOrLatestSeasonForAppId(1, 730);
    if (activeSeason) {
      const filtersHasActiveSeason = searchParams.season_ids?.find(
        (id) => id === activeSeason.season_id
      );
      if (filtersHasActiveSeason) {
        next();
        return;
      }
      // Part of active season handling, if season_ids empty, we returning active data
      if (!searchParams.season_ids || searchParams.season_ids.length === 0) {
        next();
        return;
      }
    }

    // Skip empty /api/v1/filters? requests
    if (req.path === "/") {
      next();
      return;
    }

    // Skip combinations of team_ids and map_ids
    if (
      (searchParams.team_ids?.length ?? 0) > 0 ||
      (searchParams.map_ids?.length ?? 0) > 0
    ) {
      next();
      return;
    }

    const normalizedParams = normalizeParsedParams(searchParams);
    const cacheKey = `${cachePrefix}${req.path}:${createHash("sha1")
      .update(JSON.stringify(normalizedParams))
      .digest("hex")}`;

    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.info(`Returning cache for ${req.path} with key ${cacheKey}`);
        res.json(JSON.parse(cached));
        return;
      }

      const originalJson = res.json.bind(res);
      res.json = (body: unknown) => {
        if (res.statusCode === 200 && body) {
          redisClient
            .set(cacheKey, JSON.stringify(body), "EX", ttlSeconds)
            .catch(logger.error);
        }

        return originalJson(body);
      };

      next();
    } catch (err) {
      logger.error("Cache middleware error", err);
      next();
    }
  };
}
