import { type Request, type Response } from "express";
import {
  getDivStandings,
  getStandingsLeagues,
  getStandingsTeamsExternalId
} from "../services/standings.services";
import { BadRequestError, NotFoundError } from "../utils/errors";
import { logger } from "../utils/app-logger";
import { type RequestWithParams } from "@eggosystem/types";

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
  req: RequestWithParams<{ season_id: string }>,
  res: Response
): Promise<void> => {
  const standingsLeagues = await getStandingsLeagues(
    Number(req.params.season_id)
  );
  res.json({
    standingsLeagues
  });
};

export const getStandingsTeamsExternalIdController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { team_id } = req.params;
  const { season_id } = req.query;
  const seasonId = Number(season_id);
  if (isNaN(seasonId)) {
    throw new BadRequestError("Season ID is required");
  }
  const teams = await getStandingsTeamsExternalId(team_id, seasonId);
  if (!teams) {
    throw new NotFoundError("Championship not found for team");
  }
  res.json(teams);
};
