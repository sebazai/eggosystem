import { type Response, type NextFunction } from "express";
import {
  getActiveOrLatestSeasonForAppId,
  getActiveSignupSeasonForAppId,
  getActiveSignupOrActiveSeasonForAppId
} from "../models/season.models";
import { type RequestWithParams } from "@eggosystem/types";
import _ from "lodash";
import { expireInOneDay, redisClient } from "../utils/redisClient";
import { BadRequestError, NotFoundError } from "../utils/errors";

export const getActiveSeasonForApp = async (
  req: RequestWithParams<{ app_id: string; organizer_id: string }>,
  res: Response,
  next: NextFunction
) => {
  const app_id = Number(req.params.app_id);
  const organizer_id = Number(req.params.organizer_id);
  const redisKey = `${organizer_id}-${app_id}-active-season`;
  const dataInRedis = await redisClient.get(redisKey);
  if (dataInRedis) {
    res.set("Cache-Control", "public, max-age=86400");
    res.json({ season_id: Number(dataInRedis) });
    return;
  }
  const activeSeason = await getActiveOrLatestSeasonForAppId(
    organizer_id,
    app_id
  );
  if (!activeSeason) {
    return next(
      new NotFoundError(
        `No active season found for app ${app_id} and organizer ${organizer_id}`
      )
    );
  }
  await redisClient.set(redisKey, activeSeason.season_id, "EX", expireInOneDay);
  res.set("Cache-Control", "public, max-age=86400");
  res.json(activeSeason);
};

export const getActiveSignupSeasonForApp = async (
  req: RequestWithParams<{ app_id: string; organizer_id: string }>,
  res: Response,
  next: NextFunction
) => {
  const app_id = Number(req.params.app_id);
  const organizer_id = Number(req.params.organizer_id);

  const activeSignupSeason = await getActiveSignupSeasonForAppId(
    organizer_id,
    app_id
  );
  if (!activeSignupSeason) {
    return next(
      new NotFoundError(
        `No active signup season found for app ${app_id} and organizer ${organizer_id}`
      )
    );
  }

  const signupEndDate = activeSignupSeason.signup_end_date;
  if (!signupEndDate) {
    return next(
      new NotFoundError(
        `No signup end date found for app ${app_id} and organizer ${organizer_id}`
      )
    );
  }

  res.json(activeSignupSeason);
};

export const getActiveSignupOrActiveSeasonForAppController = async (
  req: RequestWithParams<{ app_id: string; organizer_id: string }>,
  res: Response,
  next: NextFunction
) => {
  const app_id = Number(req.params.app_id);
  const organizer_id = Number(req.params.organizer_id);

  if (
    isNaN(app_id) ||
    isNaN(organizer_id) ||
    app_id <= 0 ||
    organizer_id <= 0
  ) {
    return next(
      new BadRequestError(
        `Invalid app ID or organizer ID: app_id=${app_id}, organizer_id=${organizer_id}`
      )
    );
  }

  const ActiveSignupOrActiveSeason =
    await getActiveSignupOrActiveSeasonForAppId(organizer_id, app_id);
  res.json(ActiveSignupOrActiveSeason);
};
