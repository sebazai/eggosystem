import {
  getTeamValuesForSortter,
  getTeamPlayerValuesForSortter,
  getTeamPlayerValuesLive
} from "../../models/dashboard/sortter.models";
import type { RequestWithParams, TeamSortterValues } from "@eggosystem/types";
import { NotFoundError } from "../../utils/errors";
import { type Request, type Response, type NextFunction } from "express";
import {
  getTeamFlags,
  createTeamFlagsFromDatabase
} from "../../services/elo.services";

/**
 * Controller to get team values for sorter functionality
 * This returns all teams for a given season with their values:
 * - team name
 * - top 5 players kanaelo sum
 * - top 4 players kanaelo average
 * - team league
 * - kanaelo values for top 5 players
 */
export const getTeamValuesController = async (
  req: RequestWithParams<{ season_id: string }>,
  res: Response
): Promise<void> => {
  const seasonId = Number(req.params.season_id);

  const teamValues = await getTeamValuesForSortter(seasonId);
  res.json(teamValues);
};

/**
 * Controller to get team values for a specific team
 * Returns a single team's values for sorter functionality
 */
export const getTeamValueByIdController = async (
  req: RequestWithParams<{ season_id: string; team_id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const seasonId = Number(req.params.season_id);
  const teamId = Number(req.params.team_id);

  const teamValues = await getTeamValuesForSortter(seasonId);
  const team = teamValues.find(
    (team: TeamSortterValues) => team.team_id === teamId
  );

  if (!team) {
    return next(
      new NotFoundError(
        `Team with ID ${teamId} not found for season ${seasonId}`
      )
    );
  }

  res.json(team);
};

/**
 * Controller to get player values for a specific team in a season
 * Returns all players for a given team with their values:
 * - name
 * - steamid
 * - cs2 rank
 * - faceit level
 * - faceit elo
 * - hours
 * - kanarating (avg from all games player played)
 * - fkd (faceit k/d ratio)
 *
 * Converts null values to 0 for numeric fields in the response
 */
export const getTeamPlayerValuesController = async (
  req: RequestWithParams<{ season_id: string; team_id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const seasonId = Number(req.params.season_id);
  const teamId = Number(req.params.team_id);

  const playerValues = await getTeamPlayerValuesForSortter(seasonId, teamId);

  if (playerValues.length === 0) {
    return next(
      new NotFoundError(
        `No players found for team ${teamId} in season ${seasonId}`
      )
    );
  }

  // Convert null values to 0 for the response
  const formattedPlayerValues = playerValues.map((player) => ({
    name: player.name,
    steamid: player.steamid,
    cs2_rank: player.cs2_rank ?? 0,
    faceit_level: player.faceit_level ?? 0,
    faceit_elo: player.faceit_elo ?? 0,
    hours: player.hours ?? 0,
    kanarating: player.kanarating ?? 0,
    fkd: player.fkd ?? 0,
    kana_elo: player.kana_elo ?? 0,
    calculus: player.calculus ?? null
  }));

  res.json(formattedPlayerValues);
};

export const getTeamFlagsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get all team flags from Redis
    const teamFlags = await getTeamFlags();

    res.json(teamFlags);
  } catch (error) {
    next(error);
  }
};

export const refreshTeamFlagsFromDatabaseController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Force refresh from database by calling getTeamFlags
    // This will trigger createTeamFlagsFromDatabase if no flags exist
    const teamFlags = await getTeamFlags();

    res.json({
      message: "Team flags refreshed from database",
      count: teamFlags.length,
      flags: teamFlags
    });
  } catch (error) {
    next(error);
  }
};

export const refreshTeamFlagsForSeasonController = async (
  req: RequestWithParams<{ season_id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const seasonId = Number(req.params.season_id);

    // Create flags specifically for this season
    await createTeamFlagsFromDatabase(seasonId);

    // Get the updated flags
    const teamFlags = await getTeamFlags();

    res.json({
      message: `Team flags refreshed for season ${seasonId}`,
      count: teamFlags.length,
      flags: teamFlags
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to get LIVE player values for a specific team in a season
 * Uses SeasonTeamPlayers (live data) instead of SeasonTeamRegistrationPlayers
 * This shows players who are currently on the team, including those added after sortter finalization
 *
 * Returns all players for a given team with their values:
 * - name
 * - steamid
 * - cs2 rank
 * - faceit level
 * - faceit elo
 * - hours
 * - kanarating (avg from all games player played)
 * - fkd (faceit k/d ratio)
 * - role (primary/substitute)
 * - is_captain
 * - is_co_captain
 *
 * Converts null values to 0 for numeric fields in the response
 */
export const getTeamPlayerValuesLiveController = async (
  req: RequestWithParams<{ season_id: string; team_id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const seasonId = Number(req.params.season_id);
  const teamId = Number(req.params.team_id);

  const playerValues = await getTeamPlayerValuesLive(seasonId, teamId);

  if (playerValues.length === 0) {
    return next(
      new NotFoundError(
        `No players found for team ${teamId} in season ${seasonId}`
      )
    );
  }

  // Convert null values to 0 for the response
  const formattedPlayerValues = playerValues.map((player) => ({
    name: player.name,
    steamid: player.steamid,
    cs2_rank: player.cs2_rank ?? 0,
    faceit_level: player.faceit_level ?? 0,
    faceit_elo: player.faceit_elo ?? 0,
    hours: player.hours ?? 0,
    kanarating: player.kanarating ?? 0,
    fkd: player.fkd ?? 0,
    kana_elo: player.kana_elo ?? 0,
    calculus: player.calculus ?? null,
    role: player.role,
    is_captain: player.is_captain,
    is_co_captain: player.is_co_captain,
    match_id: player.match_id,
    match_info: player.match_info
  }));

  res.json(formattedPlayerValues);
};
