import { type Response } from "express";
import {
  getTeamValuesForSorter,
  getTeamPlayerValuesForSortter,
  getTeamsForSeason,
  checkPlayerAdditionEligibility
} from "../models/sortter.models";
import type { RequestWithParams, TeamSortterValues } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";

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

  // Check if we have historical data in SeasonLeagueTeams
  const query = `
    SELECT COUNT(*) as count
    FROM SeasonLeagueTeams
    WHERE season_id = ?
  `;

  const result = await runQuery<Array<{ count: number }>>(query, [seasonId]);
  const hasHistoricalData = result.length > 0 && result[0].count > 0;

  // Pass isHistorical=true if we have historical data
  const teamValues = await getTeamValuesForSorter(seasonId, {
    isHistorical: hasHistoricalData
  });
  res.json(teamValues);
};

/**
 * Controller to get team values for a specific team
 * Returns a single team's values for sorter functionality
 */
export const getTeamValueByIdController = async (
  req: RequestWithParams<{ season_id: string; team_id: string }>,
  res: Response
): Promise<void> => {
  const seasonId = Number(req.params.season_id);
  const teamId = Number(req.params.team_id);

  // Check if we have historical data in SeasonLeagueTeams
  const query = `
    SELECT COUNT(*) as count
    FROM SeasonLeagueTeams
    WHERE season_id = ?
  `;

  const result = await runQuery<Array<{ count: number }>>(query, [seasonId]);
  const hasHistoricalData = result.length > 0 && result[0].count > 0;

  const teamValues = await getTeamValuesForSorter(seasonId, {
    isHistorical: hasHistoricalData
  });
  const team = teamValues.find(
    (team: TeamSortterValues) => team.team_id === teamId
  );

  if (!team) {
    res.status(404).json({
      message: `Team with ID ${teamId} not found for season ${seasonId}`
    });
    return;
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
  req: RequestWithParams<{ season: string; team: string }>,
  res: Response
): Promise<void> => {
  const seasonId = Number(req.params.season);
  const teamId = Number(req.params.team);

  // Check if we have historical data in SeasonLeagueTeams
  const query = `
    SELECT COUNT(*) as count
    FROM SeasonLeagueTeams
    WHERE season_id = ?
  `;

  const result = await runQuery<Array<{ count: number }>>(query, [seasonId]);
  const hasHistoricalData = result.length > 0 && result[0].count > 0;

  const playerValues = await getTeamPlayerValuesForSortter(seasonId, teamId, {
    isHistorical: hasHistoricalData
  });

  if (playerValues.length === 0) {
    res.status(404).json({
      message: `No players found for team ${teamId} in season ${seasonId}`
    });
    return;
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

/**
 * Controller to get all teams for a specific season
 * Returns teams with their league information
 */
export const getTeamsForSeasonController = async (
  req: RequestWithParams<{ season_id: string }>,
  res: Response
): Promise<void> => {
  const seasonId = Number(req.params.season_id);

  // Check if we have historical data in SeasonLeagueTeams
  const query = `
    SELECT COUNT(*) as count
    FROM SeasonLeagueTeams
    WHERE season_id = ?
  `;

  const result = await runQuery<Array<{ count: number }>>(query, [seasonId]);
  const hasHistoricalData = result.length > 0 && result[0].count > 0;

  const teams = await getTeamsForSeason(seasonId, hasHistoricalData);
  res.json(teams);
};

/**
 * Controller to check if a player can be added to a team
 * Returns analysis of the player's impact on team balance
 */
export const checkPlayerAdditionEligibilityController = async (
  req: RequestWithParams<{
    season_id: string;
    team_id: string;
    steam_id: string;
  }>,
  res: Response
): Promise<void> => {
  const seasonId = Number(req.params.season_id);
  const teamId = Number(req.params.team_id);
  const steamId = req.params.steam_id;

  // Check if we have historical data in SeasonLeagueTeams
  const query = `
    SELECT COUNT(*) as count
    FROM SeasonLeagueTeams
    WHERE season_id = ?
  `;

  const result = await runQuery<Array<{ count: number }>>(query, [seasonId]);
  const hasHistoricalData = result.length > 0 && result[0].count > 0;

  try {
    const eligibility = await checkPlayerAdditionEligibility(
      seasonId,
      teamId,
      steamId,
      hasHistoricalData
    );
    res.json(eligibility);
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
};
