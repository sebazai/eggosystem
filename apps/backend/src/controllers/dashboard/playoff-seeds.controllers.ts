import { type Response, type NextFunction } from "express";
import type {
  RequestWithParams,
  RequestWithParamsAndBody
} from "@eggosystem/types";
import {
  getPlayoffSeedsBySeasonAndLeague,
  updatePlayoffSeeds
} from "../../models/season-league-team.models";
import { getSeasonLeaguesWithMappingsBySeasonId } from "../../models/season-league.models";
import { BadRequestError } from "../../utils/errors";

/**
 * GET /api/v1/dashboard/playoff-seeds/season/:season_id/leagues
 * Returns leagues for the season from SeasonLeagues (for dropdown).
 */
export const getPlayoffSeedLeaguesController = async (
  req: RequestWithParams<{ season_id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const seasonId = Number(req.params.season_id);
  if (!Number.isFinite(seasonId)) {
    return next(new BadRequestError("Invalid season_id"));
  }
  const leagues = await getSeasonLeaguesWithMappingsBySeasonId(seasonId);
  res.json(
    leagues.map((l) => ({
      league_id: l.league_id,
      league_name: l.league_name,
      tier: l.tier
    }))
  );
};

/**
 * GET /api/v1/dashboard/playoff-seeds/season/:season_id/league/:league_id
 * Returns teams with their playoff_seed for the given season+league.
 */
export const getPlayoffSeedsController = async (
  req: RequestWithParams<{ season_id: string; league_id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const seasonId = Number(req.params.season_id);
  const leagueId = Number(req.params.league_id);
  if (!Number.isFinite(seasonId) || !Number.isFinite(leagueId)) {
    return next(new BadRequestError("Invalid season_id or league_id"));
  }
  const teams = await getPlayoffSeedsBySeasonAndLeague(seasonId, leagueId);
  res.json(teams);
};

/**
 * PUT /api/v1/dashboard/playoff-seeds/season/:season_id/league/:league_id
 * Body: { seeds: Array<{ team_id: number; playoff_seed: number }> }
 */
export const putPlayoffSeedsController = async (
  req: RequestWithParamsAndBody<
    { season_id: string; league_id: string },
    { seeds: Array<{ team_id: number; playoff_seed: number }> }
  >,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const seasonId = Number(req.params.season_id);
  const leagueId = Number(req.params.league_id);
  if (!Number.isFinite(seasonId) || !Number.isFinite(leagueId)) {
    return next(new BadRequestError("Invalid season_id or league_id"));
  }
  const seeds = req.body?.seeds;
  if (!Array.isArray(seeds)) {
    return next(new BadRequestError("Body must include seeds array"));
  }
  const updates = seeds.filter(
    (s): s is { team_id: number; playoff_seed: number } =>
      typeof s?.team_id === "number" &&
      Number.isFinite(s.team_id) &&
      typeof s?.playoff_seed === "number" &&
      Number.isFinite(s.playoff_seed) &&
      s.playoff_seed >= 1
  );
  await updatePlayoffSeeds(seasonId, leagueId, updates);
  const teams = await getPlayoffSeedsBySeasonAndLeague(seasonId, leagueId);
  res.json(teams);
};
