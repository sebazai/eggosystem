import { type Request, type Response, type NextFunction } from "express";
import {
  getSeasons,
  getSeasonById,
  getSeasonDetailsById
} from "../models/season.models";
import _ from "lodash";
import { NotFoundError } from "../utils/errors";
import { getFaceitLinksForSeason } from "../models/faceit.models";
import { getTeamCaptainsBySeasonId } from "../models/team.models";
import type { RequestWithParams } from "@eggosystem/types";

export const getSeasonsController = async (_req: Request, res: Response) => {
  const allSeasons = await getSeasons();
  res.json(allSeasons);
};

export const getSeasonByIdController = async (
  req: RequestWithParams<{ season_id: string }>,
  res: Response,
  next: NextFunction
) => {
  const { season_id } = req.params;
  const season = await getSeasonById(Number(season_id));
  if (!season) {
    return next(new NotFoundError("Season not found"));
  }
  res.json(season);
};

export const getSeasonDetailsByIdController = async (
  req: RequestWithParams<{ season_id: string }>,
  res: Response,
  next: NextFunction
) => {
  const { season_id } = req.params;
  const season = await getSeasonDetailsById(Number(season_id));
  if (!season) {
    return next(new NotFoundError("Season not found"));
  }
  res.json(season);
};

export const getFaceitLinksForSeasonController = async (
  req: RequestWithParams<{ season_id: string }>,
  res: Response
) => {
  const faceitLinks = await getFaceitLinksForSeason(
    Number(req.params.season_id)
  );
  res.json(faceitLinks);
};

export const getTeamCaptainsBySeasonIdController = async (
  req: RequestWithParams<{ season_id: string }>,
  res: Response
) => {
  const captains = await getTeamCaptainsBySeasonId(
    Number(req.params.season_id)
  );
  res.json(captains);
};
