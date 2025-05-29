import { type Request, type Response } from "express";
import {
  getSeasons,
  getSeasonById,
  getSeasonDetailsById,
  getActiveOrLatestSeasonForAppId,
  getActiveSignupSeasonForAppId
} from "../models/season.models";
import { type RequestWithParams } from "@eggosystem/types";
import _ from "lodash";
import { expireIn30Days, redisClient } from "../utils/redisClient";

export const getSeasonsController = async (_req: Request, res: Response) => {
  const allSeasons = await getSeasons();
  res.json(allSeasons);
};

export const getSeasonByIdController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const season = await getSeasonById(Number(id));
  if (!season) {
    res.status(404).json({ message: "Season not found" });
    return;
  }
  res.json(season);
};

export const getSeasonDetailsByIdController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  const season = await getSeasonDetailsById(Number(id));
  if (!season) {
    res.status(404).json({ message: "Season not found" });
    return;
  }
  res.json(season);
};

export const getActiveSeasonForApp = async (
  req: RequestWithParams<{ app_id: string }>,
  res: Response
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
    res.status(404).json({ message: "No active season found for app" });
    return;
  }
  await redisClient.set(redisKey, activeSeason.season_id, "EX", expireIn30Days);
  res.set("Cache-Control", "public, max-age=86400");
  res.json(activeSeason);
};

export const getActiveSignupSeasonForApp = async (
  req: RequestWithParams<{ app_id: string }>,
  res: Response
) => {
  const app_id = Number(req.params.app_id);

  const activeSignupSeason = await getActiveSignupSeasonForAppId(app_id);
  if (!activeSignupSeason) {
    res.status(404).json({ message: "No active signup season found for app" });
    return;
  }

  const signupEndDate = activeSignupSeason.signup_end_date;
  if (!signupEndDate) {
    res.status(404).json({ message: "No signup end date found for app" });
    return;
  }

  res.json(activeSignupSeason);
};
