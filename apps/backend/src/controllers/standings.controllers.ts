import { type Request, type Response } from "express";
import {
  getDivStandings,
  getStandingsLeagues
} from "../services/standings.services";
import { BadRequestError } from "../utils/errors";
import { logger } from "../utils/app-logger";
import { getActiveSeasonForAppId } from "../models/season.models";

interface StandingsParams {
  faceit_league_id: string;
}

export const getStandingsController = async (
  req: Request<StandingsParams>,
  res: Response
): Promise<void> => {
  const { faceit_league_id } = req.params;

  if (!faceit_league_id) {
    throw new BadRequestError("Faceit League ID is required");
  }

  logger.info(`Fetching standings for league: ${faceit_league_id}`);

  const standings = await getDivStandings(faceit_league_id);

  res.json({
    standings
  });
};

export const getFaceitLeaguesController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const activeSeason = (await getActiveSeasonForAppId(730)) || {
    season_id: 16
  };
  if (!activeSeason) {
    res.json({
      standingsLeagues: []
    });
    return;
  }

  const standingsLeagues = await getStandingsLeagues(activeSeason.season_id);

  res.json({
    standingsLeagues
  });
};
