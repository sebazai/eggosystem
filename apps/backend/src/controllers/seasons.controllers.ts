import { type Request, type Response, type NextFunction } from "express";
import {
  getSeasons,
  getSeasonById,
  getSeasonDetailsById,
  getActiveOrLatestSeasonForAppId,
  getActiveSignupSeasonForAppId,
  getActiveSignupOrActiveSeasonForAppId
} from "../models/season.models";
import { type RequestWithParams } from "@eggosystem/types";
import _ from "lodash";
import { expireIn30Days, redisClient } from "../utils/redisClient";
import { NotFoundError } from "../utils/errors";

export const getSeasonsController = async (_req: Request, res: Response) => {
  const allSeasons = await getSeasons();
  res.json(allSeasons);
};

export const getSeasonByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const season = await getSeasonById(Number(id));
  if (!season) {
    return next(new NotFoundError("Season not found"));
  }
  res.json(season);
};

export const getSeasonDetailsByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const season = await getSeasonDetailsById(Number(id));
  if (!season) {
    return next(new NotFoundError("Season not found"));
  }
  res.json(season);
};

export const getActiveSeasonForApp = async (
  req: RequestWithParams<{ app_id: string }>,
  res: Response,
  next: NextFunction
) => {
  const app_id = Number(req.params.app_id);
  const redisKey = `${app_id}-active-season`;
  const dataInRedis = await redisClient.get(redisKey);
  if (dataInRedis) {
    res.set("Cache-Control", "public, max-age=86400");
    res.json({ season_id: Number(dataInRedis) });
    return;
  }
  const activeSeason = await getActiveOrLatestSeasonForAppId(app_id);
  if (!activeSeason) {
    return next(new NotFoundError("No active season found for app"));
  }
  await redisClient.set(redisKey, activeSeason.season_id, "EX", expireIn30Days);
  res.set("Cache-Control", "public, max-age=86400");
  res.json(activeSeason);
};

export const getActiveSignupSeasonForApp = async (
  req: RequestWithParams<{ app_id: string }>,
  res: Response,
  next: NextFunction
) => {
  const app_id = Number(req.params.app_id);

  const activeSignupSeason = await getActiveSignupSeasonForAppId(app_id);
  if (!activeSignupSeason) {
    return next(new NotFoundError("No active signup season found for app"));
  }

  const signupEndDate = activeSignupSeason.signup_end_date;
  if (!signupEndDate) {
    return next(new NotFoundError("No signup end date found for app"));
  }

  res.json(activeSignupSeason);
};

export const getActiveSignupOrActiveSeasonForAppController = async (
  req: RequestWithParams<{ app_id: string }>,
  res: Response
) => {
  const app_id = Number(req.params.app_id);

  const ActiveSignupOrActiveSeason =
    await getActiveSignupOrActiveSeasonForAppId(app_id);
  res.json(ActiveSignupOrActiveSeason);
};
